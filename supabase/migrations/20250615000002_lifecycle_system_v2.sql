-- ═══════════════════════════════════════════════════════════════════════════════════
-- 全生命周期追踪系统 - 数据库迁移
-- 作者: PartnerNexus Team
-- 日期: 2025-06-15
-- 版本: v2.0.0
--
-- 本迁移为以下5个核心业务实体建立端到端(end-to-end)生命周期追踪能力：
--   1. 合作伙伴 (Partner)
--   2. 商机报备 (Deal)
--   3. 激励计划 (Incentive Program)
--   4. 培训认证 (Training / Certification)
--   5. 营销活动 (Marketing Activity)
--
-- 设计原则：
--   - 不可变事件日志：每次阶段变更产生一条不可变更的事件记录
--   - 主表快照：每个实体表保留"当前阶段"字段，便于快速查询
--   - 统一事件结构：所有生命周期事件表结构一致，便于通用服务层开发
--   - 元数据自描述：每个事件携带足够元数据支持分析（操作人、原因、相关商机等）
--
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ================================================================================
-- 生命周期阶段枚举值定义 (作为注释，实际使用TEXT类型存储)
-- ================================================================================
-- PartnerLifecycleStage:
--   'Prospecting'      // 潜在客户（未签约）
--   'Application'       // 已提交申请表
--   'UnderReview'       // 渠道经理审核中
--   'Approved'          // 正式签约批复
--   'Onboarding'        // 入职培训期
--   'Active'            // 活跃合作中
--   'RetentionReview'   // 续约评估中
--   'Renewed'           // 已续约
--   'Dormant'           // 休眠（180天无活动）
--   'Terminated'        // 终止合作
--
-- DealLifecycleStage:
--   'Registered'        // 已报备
--   'UnderReview'       // 审核中
--   'Approved'          // 已批复
--   'Solution'          // 方案跟进
--   'Commercial'        // 商务洽谈
--   'Negotiation'       // 合同谈判
--   'ClosedWon'         // 赢单
--   'ClosedLost'        // 丢单
--   'Migrated'          // 迁单
--
-- IncentiveLifecycleStage:
--   'Draft'             // 草拟
--   'Planning'          // 规划中
--   'Active'            // 进行中（可申请）
--   'Evaluation'        // 评估期
--   'Payout'            // 奖金发放中
--   'Completed'         // 完成
--   'Expired'           // 过期
--   'Cancelled'         // 取消
--
-- TrainingLifecycleStage:
--   'Draft'             // 课程草稿
--   'Enrolling'         // 报名中
--   'InProgress'        // 学习中
--   'Assessing'         // 考核中
--   'Certified'         // 已认证
--   'Valid'             // 证书有效
--   'Expiring'          // 即将过期
--   'Expired'           // 已过期
--   'Renewed'           // 已续期
--
-- MarketingLifecycleStage:
--   'Draft'             // 活动草案
--   'Planning'          // 策划中
--   'Scheduled'         // 已排期
--   'Active'            // 进行中
--   'Converting'        // 转化追踪期
--   'Reporting'         // 复盘报告中
--   'Completed'         // 完成
--   'Archived'          // 归档
--   'Cancelled'         // 取消

-- ================================================================================
-- 1. PARTNER（合作伙伴）生命周期增强
-- ================================================================================

-- ── 1.1 扩展 partners 主表 ──────────────────────────────────────────────────
ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE partners ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;  -- 0-100，健康度
ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action TEXT;                  -- 下一步操作建议
ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action_deadline DATE;         -- 操作截止日期
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;       -- 最后活跃时间
ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_completion INT DEFAULT 0;  -- 入职完成度 0-100
ALTER TABLE partners ADD COLUMN IF NOT EXISTS retention_flag TEXT;               -- '需评估' / '优先保留' 等

-- 计算字段（聚合自关联表）
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_revenue_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS active_deals_count INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS training_completion_rate DECIMAL(5,2) DEFAULT 0;

-- ── 1.2 创建 partner_lifecycle_events 事件表 ───────────────────────────────
CREATE TABLE IF NOT EXISTS partner_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  from_stage TEXT,                          -- 变更前阶段（可为空，如新创建）
  to_stage TEXT NOT NULL,                   -- 变更后阶段
  event_date TIMESTAMPTZ DEFAULT NOW(),     -- 事件发生时间
  operator TEXT,                            -- 操作人 / 'system' 表示系统自动
  event_type TEXT NOT NULL,                 -- 'stage_change' / 'auto_dormant' / 'health_update' / 'manual'
  reason TEXT,                              -- 变更原因说明
  notes TEXT,                               -- 备注
  related_deal_id UUID REFERENCES deals(id),  -- 关联商机（如有）
  related_application_id UUID,              -- 关联其他申请
  duration_days_previous INTEGER,           -- 在上一阶段停留天数
  health_delta INTEGER,                     -- 健康度变化（正数增加，负数减少）
  metadata JSONB DEFAULT '{}',              -- 灵活扩展字段
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_partner_lifecycle_partner
  ON partner_lifecycle_events(partner_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_partner_lifecycle_stage
  ON partner_lifecycle_events(to_stage);
CREATE INDEX IF NOT EXISTS idx_partner_lifecycle_event_date
  ON partner_lifecycle_events(event_date DESC);

ALTER TABLE partner_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on partner_lifecycle_events"
  ON partner_lifecycle_events FOR ALL USING (true) WITH CHECK (true);

-- ================================================================================
-- 2. DEAL（商机）生命周期增强
-- ================================================================================

-- ── 2.1 扩展 deals 主表（补充缺失字段）───────────────────────────────────
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_since_registration INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_action_deadline DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_quality TEXT DEFAULT 'Warm';   -- 'Hot'/'Warm'/'Cold'
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(15,2) DEFAULT 0; -- 加权金额（按阶段概率）
ALTER TABLE deals ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,2) DEFAULT 0.25;  -- 当前赢单概率

-- 补充已存在的字段（确保数据完整性）
DO $$ BEGIN
  -- 这些字段在之前的迁移中已添加，这里确保存在
  -- 如果字段不存在会报错，所以使用 COLUMN IF NOT EXISTS
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS origin_activity_id UUID REFERENCES marketing_activities(id);
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS incentive_program_id UUID REFERENCES incentive_programs(id);
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';
  ALTER TABLE deals ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ── 2.2 deal_lifecycle_events 已存在，增强字段 ────────────────────────────
DO $$ BEGIN
  -- 确保扩展字段存在
  ALTER TABLE deal_lifecycle_events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'stage_change';
  ALTER TABLE deal_lifecycle_events ADD COLUMN IF NOT EXISTS from_stage TEXT;
  ALTER TABLE deal_lifecycle_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
  ALTER TABLE deal_lifecycle_events ADD COLUMN IF NOT EXISTS health_delta INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 增强索引
CREATE INDEX IF NOT EXISTS idx_deal_lifecycle_deal_stage
  ON deal_lifecycle_events(deal_id, stage, event_date DESC);

-- ================================================================================
-- 3. INCENTIVE（激励计划）生命周期增强
-- ================================================================================

-- ── 3.1 扩展 incentive_programs 主表 ──────────────────────────────────────
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS next_action_deadline DATE;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS expected_payout_date DATE;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS budget_utilization_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;  -- 投资回报率
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS participating_partners_count INTEGER DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS generated_deal_value DECIMAL(15,2) DEFAULT 0;

-- 确保扩展字段存在
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';

-- ── 3.2 创建 incentive_program_lifecycle_events 事件表 ─────────────────────
CREATE TABLE IF NOT EXISTS incentive_program_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES incentive_programs(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  payout_batch_id TEXT,
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incentive_lifecycle_program
  ON incentive_program_lifecycle_events(program_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_incentive_lifecycle_stage
  ON incentive_program_lifecycle_events(to_stage);

ALTER TABLE incentive_program_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on incentive_program_lifecycle_events"
  ON incentive_program_lifecycle_events FOR ALL USING (true) WITH CHECK (true);

-- ── 3.3 扩展 incentive_applications 申请子生命周期 ────────────────────────
-- 确保表存在后添加字段（表在之前的迁移中创建）
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incentive_applications') THEN
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS application_stage TEXT DEFAULT 'submitted';
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
    ALTER TABLE incentive_applications ADD COLUMN IF NOT EXISTS review_notes TEXT;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ================================================================================
-- 4. TRAINING / ENABLEMENT（培训认证）生命周期增强
-- ================================================================================

-- ── 4.1 扩展 certification_programs 主表 ───────────────────────────────────
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Enrolling';
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS next_action_deadline DATE;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS average_score DECIMAL(6,2) DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS certificate_validity_days INTEGER DEFAULT 365;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS certification_count INTEGER DEFAULT 0;

-- ── 4.2 创建 training_lifecycle_events 事件表 ───────────────────────────────
CREATE TABLE IF NOT EXISTS training_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES certification_programs(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES user_enrollments(id),  -- 可关联具体报名记录
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,  -- 'program_stage' / 'enrollment_update' / 'assessment_result' / 'certificate_issued'
  reason TEXT,
  notes TEXT,
  assessment_score INTEGER,
  certificate_id TEXT,
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_lifecycle_program
  ON training_lifecycle_events(program_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_lifecycle_enrollment
  ON training_lifecycle_events(enrollment_id);

ALTER TABLE training_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on training_lifecycle_events"
  ON training_lifecycle_events FOR ALL USING (true) WITH CHECK (true);

-- ── 4.3 扩展 user_enrollments 报名记录 ───────────────────────────────────
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS enrollment_stage TEXT DEFAULT 'enrolled';
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_score INTEGER;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN DEFAULT false;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_id UUID;  -- 关联伙伴
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;

-- ================================================================================
-- 5. MARKETING（营销活动）生命周期增强
-- ================================================================================

-- ── 5.1 扩展 marketing_activities 主表 ────────────────────────────────────
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Planning';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS next_action_deadline DATE;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS registered_attendees INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS checked_in_attendees INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lead_conversion_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS deal_conversion_count INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS total_deal_value_generated DECIMAL(15,2) DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'seed';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CNY';

-- ── 5.2 创建 marketing_lifecycle_events 事件表 ─────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES marketing_activities(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,  -- 'stage_change' / 'attendee_milestone' / 'deal_generated' / 'roi_analysis'
  reason TEXT,
  notes TEXT,
  new_leads_count INTEGER,
  new_deals_count INTEGER,
  new_deal_value DECIMAL(15,2),
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_lifecycle_activity
  ON marketing_lifecycle_events(activity_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_lifecycle_stage
  ON marketing_lifecycle_events(to_stage);

ALTER TABLE marketing_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on marketing_lifecycle_events"
  ON marketing_lifecycle_events FOR ALL USING (true) WITH CHECK (true);

-- ── 5.3 扩展 campaign_attendees 参会者子生命周期 ──────────────────────────
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS attendee_lifecycle_stage TEXT DEFAULT 'registered';
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_assigned_to TEXT;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS deal_id UUID;  -- 已关联的商机ID

-- ================================================================================
-- 6. 跨实体关联：建立实体生命周期之间的关系视图
-- ================================================================================
-- 视图定义仅用于查询，不修改数据结构

-- 合作伙伴-商机联动视图：显示每个合作伙伴的所有商机阶段分布
CREATE OR REPLACE VIEW v_partner_deal_pipeline AS
SELECT
  p.id AS partner_id,
  p.name AS partner_name,
  p.lifecycle_stage AS partner_stage,
  p.health_score AS partner_health,
  COUNT(d.id) AS total_deals,
  COUNT(d.id) FILTER (WHERE d.stage = 'Registered') AS stage_registered,
  COUNT(d.id) FILTER (WHERE d.stage = 'UnderReview') AS stage_underreview,
  COUNT(d.id) FILTER (WHERE d.stage = 'Approved') AS stage_approved,
  COUNT(d.id) FILTER (WHERE d.stage = 'Solution') AS stage_solution,
  COUNT(d.id) FILTER (WHERE d.stage = 'Commercial') AS stage_commercial,
  COUNT(d.id) FILTER (WHERE d.stage = 'Negotiation') AS stage_negotiation,
  COUNT(d.id) FILTER (WHERE d.stage = 'ClosedWon') AS stage_closedwon,
  COUNT(d.id) FILTER (WHERE d.stage = 'ClosedLost') AS stage_closedlost,
  COALESCE(SUM(d.value), 0) AS total_pipeline_value,
  COALESCE(SUM(d.weighted_value), 0) AS total_weighted_value,
  ROUND(CASE WHEN COUNT(d.id) > 0 THEN 100.0 * COUNT(d.id) FILTER (WHERE d.stage = 'ClosedWon') / COUNT(d.id) ELSE 0 END, 2) AS win_rate
FROM partners p
LEFT JOIN deals d ON d.partner_id = p.id
GROUP BY p.id, p.name, p.lifecycle_stage, p.health_score;

-- 激励-商机联动视图：显示每个激励计划产生的商机情况
CREATE OR REPLACE VIEW v_incentive_program_impact AS
SELECT
  ip.id AS program_id,
  ip.title AS program_title,
  ip.lifecycle_stage AS program_stage,
  COUNT(ia.id) AS applications_count,
  COUNT(DISTINCT ia.partner_id) AS participating_partners,
  COALESCE(SUM(ia.deal_value), 0) AS total_deal_value,
  COALESCE(SUM(ia.approved_amount), 0) AS total_payout,
  ROUND(CASE WHEN COALESCE(SUM(ia.approved_amount), 0) > 0 THEN COALESCE(SUM(ia.deal_value), 0) / NULLIF(SUM(ia.approved_amount), 0) ELSE 0 END, 2) AS roi_multiplier
FROM incentive_programs ip
LEFT JOIN incentive_applications ia ON ia.program_id = ip.id
GROUP BY ip.id, ip.title, ip.lifecycle_stage;

-- 营销活动-商机转化视图
CREATE OR REPLACE VIEW v_marketing_activity_conversion AS
SELECT
  ma.id AS activity_id,
  ma.name AS activity_name,
  ma.lifecycle_stage AS activity_stage,
  COUNT(DISTINCT ca.id) AS total_attendees,
  COUNT(DISTINCT ca.id) FILTER (WHERE ca.checked_in = true) AS checked_in_attendees,
  COUNT(DISTINCT d.id) AS generated_deals,
  COALESCE(SUM(d.value), 0) AS generated_deal_value,
  ROUND(CASE WHEN COUNT(DISTINCT ca.id) > 0 THEN 100.0 * COUNT(DISTINCT d.id) / COUNT(DISTINCT ca.id) ELSE 0 END, 2) AS attendee_to_deal_conversion_rate
FROM marketing_activities ma
LEFT JOIN campaign_attendees ca ON ca.campaign_id = (SELECT id FROM marketing_campaigns WHERE marketing_campaigns.name = ma.name LIMIT 1)
LEFT JOIN deals d ON d.origin_activity_id = ma.id
GROUP BY ma.id, ma.name, ma.lifecycle_stage;

-- ================================================================================
-- 7. 自动更新触发器 - 计算当前阶段停留天数
-- ================================================================================

-- Partner 阶段停留天数自动更新
CREATE OR REPLACE FUNCTION calc_partner_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_entered_at IS NOT NULL THEN
    NEW.days_in_current_stage := CURRENT_DATE - NEW.stage_entered_at::DATE;
  END IF;
  -- 最后活跃时间
  NEW.last_activity_at := COALESCE(NEW.last_activity_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partner_days_calc ON partners;
CREATE TRIGGER trigger_partner_days_calc
  BEFORE UPDATE OF lifecycle_stage, stage_entered_at ON partners
  FOR EACH ROW EXECUTE FUNCTION calc_partner_days_in_stage();

-- Deal 阶段停留天数自动更新
CREATE OR REPLACE FUNCTION calc_deal_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_entered_at IS NOT NULL THEN
    NEW.days_in_current_stage := CURRENT_DATE - NEW.stage_entered_at::DATE;
  END IF;
  IF NEW.created_date IS NOT NULL THEN
    NEW.days_since_registration := CURRENT_DATE - NEW.created_date::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_days_calc ON deals;
CREATE TRIGGER trigger_deal_days_calc
  BEFORE UPDATE OF stage, stage_entered_at, created_date ON deals
  FOR EACH ROW EXECUTE FUNCTION calc_deal_days_in_stage();

-- ================================================================================
-- 完成
-- ================================================================================
