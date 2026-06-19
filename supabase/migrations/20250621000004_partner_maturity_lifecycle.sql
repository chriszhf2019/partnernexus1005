-- ═════════════════════════════════════════════════════════════════════════
-- Partner Maturity Lifecycle System
-- 合作伙伴关系深度生命周期管理系统
--
-- 核心理念：
--   1. 准入期 (Transactional) - 交易驱动：关注利润分配、合规管理、单笔交易利益
--   2. 赋能期 (Transitional) - 能力过渡：通过培训与赋能，让伙伴从"只会卖货"转向"能提供服务"
--   3. 协同期 (Relational) - 关系驱动：双方不再只关注单一产品的买卖，而是共同出方案，交叉销售
--   4. 共生期 (Symbiotic) - 战略驱动：数字化、战略、甚至股权或业务底层深度交织，你中有我，我中有你
--
-- 评估维度（6大维度，0-100分）：
--   1. 商机活跃度 (deal_activity): 近90天报备数 + 赢单率 + 最近商机时间
--   2. 能力建设 (capability): 赢单率、伙伴等级、行业覆盖、是否有认证
--   3. 赋能参与 (enablement): 培训报名数、认证数、参与的激励计划数
--   4. 协同共创 (collaboration): 是否有联合方案、共同商机、MDF使用量、高层互访
--   5. 战略对齐 (strategic_alignment): 合作年限、是否为核心伙伴、商机的稳定性
--   6. 系统耦合 (system_integration): 伙伴在系统的活跃度、登录频率、数据完整性
--
-- 关键功能：
--   - 自动识别伙伴关系深度阶段
--   - 动态生成晋级评估与差距分析
--   - 风险预警与机会识别
--   - 手动/自动推进到更高阶段
--   - 关系深度演进事件记录
-- ═════════════════════════════════════════════════════════════════════════

-- --------------------------------------------------------------------------
-- 1. 更新 partners 表 - 添加关系深度生命周期字段
-- --------------------------------------------------------------------------

-- 添加关系深度阶段字段
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS maturity_stage VARCHAR(50) DEFAULT 'Transactional',
ADD COLUMN IF NOT EXISTS maturity_stage_entered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS maturity_last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 添加注释
COMMENT ON COLUMN partners.maturity_stage IS '关系深度阶段: Transactional | Transitional | Relational | Symbiotic';
COMMENT ON COLUMN partners.maturity_stage_entered_at IS '进入当前关系深度阶段的时间';
COMMENT ON COLUMN partners.maturity_last_updated IS '关系深度评估最后更新时间';

-- 为现有伙伴初始化阶段数据（基于伙伴等级和活跃状态进行初步估算）
UPDATE partners
SET
  maturity_stage = CASE
    WHEN status = 'Cooperating' AND tier IN ('Platinum', 'Premier') THEN 'Relational'
    WHEN status = 'Cooperating' AND tier = 'Gold' THEN 'Transitional'
    WHEN status = 'Cooperating' AND tier IN ('Silver', 'Bronze') THEN 'Transactional'
    WHEN status = 'Active' AND tier IN ('Platinum', 'Premier', 'Gold') THEN 'Transitional'
    ELSE 'Transactional'
  END,
  maturity_stage_entered_at = COALESCE(start_date, startDate, created_at, CURRENT_TIMESTAMP),
  maturity_last_updated = CURRENT_TIMESTAMP
WHERE
  maturity_stage IS NULL OR maturity_stage_entered_at IS NULL;

-- --------------------------------------------------------------------------
-- 2. 创建关系深度演进事件记录表
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_maturity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  partner_name VARCHAR(255),
  from_stage VARCHAR(50) NOT NULL,                    -- 原阶段: Transactional | Transitional | Relational
  to_stage VARCHAR(50) NOT NULL,                      -- 新阶段: Transitional | Relational | Symbiotic
  event_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  operator VARCHAR(100) DEFAULT 'system',             -- 操作人: 'system' | 'manual: [用户名]'
  reason TEXT,                                         -- 晋级原因/说明
  notes TEXT,                                          -- 备注
  auto_detected BOOLEAN DEFAULT FALSE,                -- 是否系统自动识别

  -- 评估快照（可选）：记录晋级时的6大维度得分
  deal_activity_score INTEGER DEFAULT 0,
  capability_score INTEGER DEFAULT 0,
  enablement_score INTEGER DEFAULT 0,
  collaboration_score INTEGER DEFAULT 0,
  strategic_alignment_score INTEGER DEFAULT 0,
  system_integration_score INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  days_in_previous_stage INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按伙伴查询
CREATE INDEX IF NOT EXISTS idx_partner_maturity_events_partner_id
  ON partner_maturity_events(partner_id);

-- 索引：按事件时间倒序
CREATE INDEX IF NOT EXISTS idx_partner_maturity_events_event_date
  ON partner_maturity_events(event_date DESC);

-- 索引：按阶段统计
CREATE INDEX IF NOT EXISTS idx_partner_maturity_events_stages
  ON partner_maturity_events(from_stage, to_stage);

-- 注释
COMMENT ON TABLE partner_maturity_events IS '合作伙伴关系深度演进事件记录';
COMMENT ON COLUMN partner_maturity_events.from_stage IS '原关系深度阶段';
COMMENT ON COLUMN partner_maturity_events.to_stage IS '新关系深度阶段';
COMMENT ON COLUMN partner_maturity_events.auto_detected IS '是否系统自动识别晋级';
COMMENT ON COLUMN partner_maturity_events.overall_score IS '晋级时的综合评分（0-100）';

-- --------------------------------------------------------------------------
-- 3. 创建关系深度阶段配置表（可定制晋级阈值）
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_maturity_stage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_key VARCHAR(50) UNIQUE NOT NULL,              -- 阶段标识: Transactional/Transitional/Relational/Symbiotic
  label VARCHAR(100) NOT NULL,                         -- 中文名称
  short_label VARCHAR(50),                             -- 简称
  description TEXT,                                    -- 详细描述
  avg_days_in_stage INTEGER DEFAULT 180,              -- 平均停留天数
  min_days_before_promotion INTEGER DEFAULT 90,       -- 晋级最低天数

  -- 6大维度晋级阈值
  deal_activity_threshold INTEGER DEFAULT 30,
  capability_threshold INTEGER DEFAULT 20,
  enablement_threshold INTEGER DEFAULT 20,
  collaboration_threshold INTEGER DEFAULT 10,
  strategic_alignment_threshold INTEGER DEFAULT 10,
  system_integration_threshold INTEGER DEFAULT 20,

  -- 该阶段的典型伙伴类型（用于统计和展示）
  typical_partner_types TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE partner_maturity_stage_config IS '关系深度阶段配置与晋级阈值';

-- 插入标准配置
INSERT INTO partner_maturity_stage_config
  (stage_key, label, short_label, description, avg_days_in_stage, min_days_before_promotion,
   deal_activity_threshold, capability_threshold, enablement_threshold,
   collaboration_threshold, strategic_alignment_threshold, system_integration_threshold,
   typical_partner_types)
VALUES
  (
    'Transactional',
    '准入与匹配期',
    '交易驱动',
    '伙伴类型：机会型、纯销售渠道、初级代理。双方基于明确的利益点（利润、产品、商机）达成初步合作。',
    180, 90,   -- 平均180天，最低90天可晋级
    30, 20, 20, 10, 10, 20,  -- 6维度基础阈值
    ARRAY['机会型', '纯销售渠道', '初级代理']
  ),
  (
    'Transitional',
    '赋能与激活期',
    '能力过渡',
    '伙伴类型：授权合作伙伴、认证服务商、专项伙伴。通过培训和赋能，让伙伴从"只会卖货"向"学会服务"转型。',
    365, 180,  -- 平均365天，最低180天可晋级
    55, 50, 55, 40, 30, 50,  -- 6维度中等阈值
    ARRAY['授权合作伙伴', '认证服务商', '专项伙伴']
  ),
  (
    'Relational',
    '协同与共创期',
    '关系驱动',
    '伙伴类型：方案合作伙伴、行业标杆伙伴。双方不再只关注单一产品的买卖，而是针对市场痛点共同出方案。',
    540, 365,  -- 平均540天，最低365天可晋级
    75, 75, 75, 70, 60, 70,  -- 6维度高等阈值
    ARRAY['方案合作伙伴', '行业标杆伙伴', '战略核心伙伴']
  ),
  (
    'Symbiotic',
    '演进与共生期',
    '战略驱动',
    '伙伴类型：战略联盟伙伴、生态核心节点、ISV（独立软件开发商）。双方在数字化、战略、甚至股权或业务底层深度交织。',
    1095, 730,  -- 最高阶段，无晋级要求
    90, 90, 90, 90, 90, 90,  -- 6维度最高阈值
    ARRAY['战略联盟伙伴', '生态核心节点', 'ISV独立软件开发商']
  )
ON CONFLICT (stage_key) DO NOTHING;

-- --------------------------------------------------------------------------
-- 4. 创建关系深度评估快照表（用于历史趋势分析）
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_maturity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,
  partner_name VARCHAR(255),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_stage VARCHAR(50) NOT NULL,                  -- 评估时的阶段
  days_in_current_stage INTEGER DEFAULT 0,

  -- 6大维度得分
  deal_activity_score INTEGER DEFAULT 0,
  capability_score INTEGER DEFAULT 0,
  enablement_score INTEGER DEFAULT 0,
  collaboration_score INTEGER DEFAULT 0,
  strategic_alignment_score INTEGER DEFAULT 0,
  system_integration_score INTEGER DEFAULT 0,

  -- 趋势指标
  deal_activity_trend VARCHAR(10) DEFAULT 'flat',      -- 'up' | 'flat' | 'down'
  capability_trend VARCHAR(10) DEFAULT 'flat',
  enablement_trend VARCHAR(10) DEFAULT 'flat',
  collaboration_trend VARCHAR(10) DEFAULT 'flat',
  strategic_alignment_trend VARCHAR(10) DEFAULT 'flat',
  system_integration_trend VARCHAR(10) DEFAULT 'flat',

  overall_score INTEGER DEFAULT 0,                     -- 综合评分
  status VARCHAR(20) DEFAULT 'monitoring',             -- 'healthy' | 'monitoring' | 'at_risk' | 'critical'

  -- 晋级准备度
  next_stage VARCHAR(50),
  readiness_percentage INTEGER DEFAULT 0,
  can_promote BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- 约束：每个伙伴每天只能有一个快照
  UNIQUE(partner_id, snapshot_date)
);

-- 索引：按伙伴和时间查询
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_partner_date
  ON partner_maturity_snapshots(partner_id, snapshot_date DESC);

-- 索引：按阶段统计
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_stage
  ON partner_maturity_snapshots(current_stage);

-- 索引：健康状态快速筛选
CREATE INDEX IF NOT EXISTS idx_maturity_snapshots_status
  ON partner_maturity_snapshots(status);

COMMENT ON TABLE partner_maturity_snapshots IS '合作伙伴关系深度评估快照（用于历史趋势分析）';
COMMENT ON COLUMN partner_maturity_snapshots.overall_score IS '综合评分（加权平均，0-100）';
COMMENT ON COLUMN partner_maturity_snapshots.status IS '健康状态: healthy(≥80) | monitoring(60-79) | at_risk(40-59) | critical(<40)';

-- --------------------------------------------------------------------------
-- 5. 创建 partners 表的阶段索引（用于快速筛选）
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_partners_maturity_stage
  ON partners(maturity_stage);

CREATE INDEX IF NOT EXISTS idx_partners_maturity_stage_entered
  ON partners(maturity_stage_entered_at DESC);

-- --------------------------------------------------------------------------
-- 6. 统计视图：关系深度阶段分布
-- --------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_partner_maturity_distribution AS
SELECT
  p.maturity_stage AS stage_key,
  COUNT(*) FILTER (WHERE p.maturity_stage = 'Transactional') AS transactional_count,
  COUNT(*) FILTER (WHERE p.maturity_stage = 'Transitional') AS transitional_count,
  COUNT(*) FILTER (WHERE p.maturity_stage = 'Relational') AS relational_count,
  COUNT(*) FILTER (WHERE p.maturity_stage = 'Symbiotic') AS symbiotic_count,
  COUNT(*) AS total_active_partners,
  ROUND(100.0 * COUNT(*) FILTER (WHERE p.maturity_stage = 'Transactional') / NULLIF(COUNT(*), 0), 1) AS transactional_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE p.maturity_stage = 'Transitional') / NULLIF(COUNT(*), 0), 1) AS transitional_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE p.maturity_stage = 'Relational') / NULLIF(COUNT(*), 0), 1) AS relational_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE p.maturity_stage = 'Symbiotic') / NULLIF(COUNT(*), 0), 1) AS symbiotic_pct
FROM partners p
WHERE p.status IN ('Cooperating', 'Active')
GROUP BY p.maturity_stage;

COMMENT ON VIEW v_partner_maturity_distribution IS '伙伴关系深度阶段分布统计视图';

-- --------------------------------------------------------------------------
-- 7. 初始化示例数据（可选）：为现有伙伴生成一些演进事件
-- --------------------------------------------------------------------------

-- 为高级伙伴生成一些历史事件记录（模拟过去的跃迁）
INSERT INTO partner_maturity_events
  (partner_id, partner_name, from_stage, to_stage, event_date, operator, reason, auto_detected,
   deal_activity_score, capability_score, enablement_score, collaboration_score,
   strategic_alignment_score, system_integration_score, overall_score, days_in_previous_stage)
SELECT
  p.id,
  p.name,
  CASE p.maturity_stage
    WHEN 'Relational' THEN 'Transitional'
    WHEN 'Transitional' THEN 'Transactional'
    ELSE 'Transactional'
  END AS from_stage,
  p.maturity_stage AS to_stage,
  COALESCE(p.maturity_stage_entered_at, p.start_date, p.startDate, p.created_at, CURRENT_TIMESTAMP) AS event_date,
  'system' AS operator,
  '系统初始化 - 基于伙伴等级和合作状态自动分配阶段' AS reason,
  TRUE AS auto_detected,
  -- 估算得分
  CASE p.tier
    WHEN 'Platinum' THEN 80
    WHEN 'Premier' THEN 70
    WHEN 'Gold' THEN 55
    WHEN 'Silver' THEN 40
    ELSE 30
  END AS deal_activity_score,
  CASE p.tier
    WHEN 'Platinum' THEN 75
    WHEN 'Premier' THEN 65
    WHEN 'Gold' THEN 50
    WHEN 'Silver' THEN 35
    ELSE 25
  END AS capability_score,
  CASE p.tier
    WHEN 'Platinum' THEN 75
    WHEN 'Premier' THEN 60
    WHEN 'Gold' THEN 45
    WHEN 'Silver' THEN 30
    ELSE 20
  END AS enablement_score,
  CASE p.tier
    WHEN 'Platinum' THEN 70
    WHEN 'Premier' THEN 55
    WHEN 'Gold' THEN 40
    WHEN 'Silver' THEN 25
    ELSE 15
  END AS collaboration_score,
  CASE p.tier
    WHEN 'Platinum' THEN 65
    WHEN 'Premier' THEN 50
    WHEN 'Gold' THEN 35
    WHEN 'Silver' THEN 25
    ELSE 15
  END AS strategic_alignment_score,
  CASE p.tier
    WHEN 'Platinum' THEN 70
    WHEN 'Premier' THEN 60
    WHEN 'Gold' THEN 45
    WHEN 'Silver' THEN 30
    ELSE 20
  END AS system_integration_score,
  CASE p.tier
    WHEN 'Platinum' THEN 73
    WHEN 'Premier' THEN 62
    WHEN 'Gold' THEN 48
    WHEN 'Silver' THEN 33
    ELSE 22
  END AS overall_score,
  COALESCE(
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - COALESCE(p.maturity_stage_entered_at, p.start_date, p.startDate, p.created_at, CURRENT_TIMESTAMP))),
    120
  )::INTEGER AS days_in_previous_stage
FROM partners p
WHERE p.status IN ('Cooperating', 'Active')
  AND p.maturity_stage IN ('Transitional', 'Relational', 'Symbiotic')
  -- 避免重复插入（如果已经有记录）
  AND NOT EXISTS (
    SELECT 1 FROM partner_maturity_events e
    WHERE e.partner_id = p.id
  )
LIMIT 100;

-- --------------------------------------------------------------------------
-- 8. 完成标记
-- --------------------------------------------------------------------------

-- 输出完成信息（用于验证）
DO $$
DECLARE
  total_partners INTEGER;
  event_count INTEGER;
  config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_partners FROM partners WHERE status IN ('Cooperating', 'Active');
  SELECT COUNT(*) INTO event_count FROM partner_maturity_events;
  SELECT COUNT(*) INTO config_count FROM partner_maturity_stage_config;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '合作伙伴关系深度生命周期系统初始化完成';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '统计信息：';
  RAISE NOTICE '  - 活跃合作伙伴总数: %', total_partners;
  RAISE NOTICE '  - 关系深度演进事件记录: %', event_count;
  RAISE NOTICE '  - 阶段配置数: %', config_count;
  RAISE NOTICE '';
  RAISE NOTICE '新增数据库对象：';
  RAISE NOTICE '  1. partners.maturity_stage - 关系深度阶段字段';
  RAISE NOTICE '  2. partners.maturity_stage_entered_at - 阶段进入时间';
  RAISE NOTICE '  3. partner_maturity_events - 演进事件记录表';
  RAISE NOTICE '  4. partner_maturity_stage_config - 阶段配置表';
  RAISE NOTICE '  5. partner_maturity_snapshots - 评估快照表';
  RAISE NOTICE '  6. v_partner_maturity_distribution - 阶段分布统计视图';
  RAISE NOTICE '  7. 相关索引 - 优化查询性能';
  RAISE NOTICE '';
  RAISE NOTICE '四大阶段说明：';
  RAISE NOTICE '  ★ Transactional (准入期) - 交易驱动，关注利润分配与合规';
  RAISE NOTICE '  ★ Transitional (赋能期) - 能力过渡，通过培训提升服务能力';
  RAISE NOTICE '  ★ Relational (协同期) - 关系驱动，共同出方案，交叉销售';
  RAISE NOTICE '  ★ Symbiotic (共生期) - 战略驱动，数字化、战略、股权深度交织';
  RAISE NOTICE '';
  RAISE NOTICE '使用方式：';
  RAISE NOTICE '  - 调用 lifecycleService.maturity.calculateHealth(partnerId) 进行评估';
  RAISE NOTICE '  - 调用 lifecycleService.maturity.advanceStage() 手动晋级';
  RAISE NOTICE '  - 调用 lifecycleService.maturity.autoScanAndPromote() 批量自动识别';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
END $$;
