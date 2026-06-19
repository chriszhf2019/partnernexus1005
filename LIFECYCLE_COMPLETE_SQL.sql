-- ============================================
-- 合作伙伴生命周期追踪系统 - 一键执行 SQL 脚本
-- 项目: partner.velolabs.top
-- Supabase Project: https://ezkbjufluczpxdixplxu.supabase.co
-- Dashboard: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu
-- ============================================

-- ===== 步骤1: 创建 exec_sql 函数 (需要先执行这个) =====
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void AS $$
BEGIN
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 步骤2: Partners 表添加生命周期字段 =====
ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE partners ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS onboarding_completion INT DEFAULT 0;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS active_deals_count INTEGER DEFAULT 0;

-- ===== 步骤3: Deals 表添加生命周期字段 =====
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Registered';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS conversion_probability DECIMAL(5,2) DEFAULT 0.25;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(15,2) DEFAULT 0;

-- ===== 步骤4: Incentive programs 表添加生命周期字段 =====
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS budget_utilization_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE incentive_programs ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

-- ===== 步骤5: Certification programs 表添加生命周期字段 =====
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Enrolling';
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE certification_programs ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 0;

-- ===== 步骤6: User enrollments 表添加生命周期字段 =====
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS enrollment_stage TEXT DEFAULT 'enrolled';
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_score INTEGER;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN DEFAULT false;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMPTZ;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- ===== 步骤7: Marketing activities 表添加生命周期字段 =====
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS days_in_current_stage INTEGER DEFAULT 0;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 80;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS roi_rate DECIMAL(8,2) DEFAULT 0;

-- ===== 步骤8: Campaign attendees 表添加关联字段 =====
ALTER TABLE campaign_attendees ADD COLUMN IF NOT EXISTS deal_id UUID;

-- ===== 步骤9: 创建生命周期事件表 =====
CREATE TABLE IF NOT EXISTS partner_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  related_deal_id UUID REFERENCES deals(id),
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  related_partner_id UUID REFERENCES partners(id),
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incentive_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES incentive_programs(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enablement_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES certification_programs(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES marketing_activities(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  event_date TIMESTAMPTZ DEFAULT NOW(),
  operator TEXT,
  event_type TEXT NOT NULL,
  reason TEXT,
  notes TEXT,
  duration_days_previous INTEGER,
  health_delta INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== 步骤10: 添加 RLS 策略 =====
ALTER TABLE partner_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE enablement_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read lifecycle events" 
  ON partner_lifecycle_events FOR SELECT 
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert lifecycle events" 
  ON partner_lifecycle_events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read deal lifecycle" 
  ON deal_lifecycle_events FOR SELECT 
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert deal lifecycle" 
  ON deal_lifecycle_events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read incentive lifecycle" 
  ON incentive_lifecycle_events FOR SELECT 
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert incentive lifecycle" 
  ON incentive_lifecycle_events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read enablement lifecycle" 
  ON enablement_lifecycle_events FOR SELECT 
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert enablement lifecycle" 
  ON enablement_lifecycle_events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read campaign lifecycle" 
  ON campaign_lifecycle_events FOR SELECT 
  USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert campaign lifecycle" 
  ON campaign_lifecycle_events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- ===== 步骤11: 创建自动计算函数 =====
CREATE OR REPLACE FUNCTION calc_partner_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_entered_at IS NOT NULL THEN
    NEW.days_in_current_stage := CURRENT_DATE - NEW.stage_entered_at::DATE;
  END IF;
  NEW.last_activity_at := COALESCE(NEW.last_activity_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calc_deal_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_entered_at IS NOT NULL THEN
    NEW.days_in_current_stage := CURRENT_DATE - NEW.stage_entered_at::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== 步骤12: 添加触发器 =====
DROP TRIGGER IF EXISTS trg_partner_stage_days ON partners;
CREATE TRIGGER trg_partner_stage_days
BEFORE INSERT OR UPDATE ON partners
FOR EACH ROW EXECUTE FUNCTION calc_partner_days_in_stage();

DROP TRIGGER IF EXISTS trg_deal_stage_days ON deals;
CREATE TRIGGER trg_deal_stage_days
BEFORE INSERT OR UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION calc_deal_days_in_stage();

-- ===== 验证: 检查字段是否添加成功 =====
SELECT
  'partners' AS table_name,
  count(*) FILTER (WHERE column_name IN ('lifecycle_stage', 'stage_entered_at', 'days_in_current_stage', 'health_score', 'next_action', 'last_activity_at')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'partners'
UNION ALL
SELECT
  'deals' AS table_name,
  count(*) FILTER (WHERE column_name IN ('stage', 'stage_entered_at', 'days_in_current_stage', 'health_score', 'conversion_probability')) AS lifecycle_fields
FROM information_schema.columns WHERE table_name = 'deals';

SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('partner_lifecycle_events', 'deal_lifecycle_events', 'incentive_lifecycle_events', 'enablement_lifecycle_events', 'campaign_lifecycle_events');

-- ============================================
-- 完成！现在可以刷新页面查看效果了
-- ============================================
