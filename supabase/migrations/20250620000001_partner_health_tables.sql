-- ═════════════════════════════════════════════════════════════════════════
-- Partner Health Scoring & Diagnosis Tables
-- 伙伴健康评分与诊断系统数据表
-- ═════════════════════════════════════════════════════════════════════════

-- 1. Market Goals — 区域/行业年度目标（用于供需错配分析）
CREATE TABLE IF NOT EXISTS market_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  region VARCHAR(100),
  industry VARCHAR(100),
  target_gmv BIGINT DEFAULT 0,           -- 年度GMV目标
  target_deals INTEGER DEFAULT 0,         -- 目标商机数
  target_partners INTEGER DEFAULT 0,      -- 目标伙伴覆盖数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, region, industry)
);

-- Seed market goals for current year
INSERT INTO market_goals (year, region, industry, target_gmv, target_deals, target_partners) VALUES
  (2026, '华北', '金融', 80000000, 40, 8),
  (2026, '华北', '政务', 60000000, 30, 6),
  (2026, '华北', '医疗', 40000000, 25, 5),
  (2026, '华东', '金融', 100000000, 50, 10),
  (2026, '华东', '医疗', 70000000, 35, 8),
  (2026, '华东', '制造', 50000000, 25, 6),
  (2026, '华南', '金融', 60000000, 30, 6),
  (2026, '华南', '政务', 50000000, 25, 5),
  (2026, '华南', '医疗', 40000000, 20, 5),
  (2026, '西部', '政务', 30000000, 15, 4),
  (2026, '西部', '能源', 25000000, 12, 3),
  (2026, '华中', '医疗', 20000000, 10, 3),
  (2026, '华中', '政务', 15000000, 8, 2)
ON CONFLICT (year, region, industry) DO NOTHING;

-- 2. Weekly Partner Score Snapshots（用于同比/环比计算）
CREATE TABLE IF NOT EXISTS partner_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coverage_score INTEGER DEFAULT 0,       -- 覆盖健康度 0-100
  vitality_score INTEGER DEFAULT 0,       -- 活跃健康度 0-100
  capability_score INTEGER DEFAULT 0,     -- 能力健康度 0-100
  overall_score INTEGER DEFAULT 0,        -- 综合评分
  deal_count INTEGER DEFAULT 0,           -- 当月商机数
  win_value BIGINT DEFAULT 0,             -- 当月赢单金额
  activity_count INTEGER DEFAULT 0,       -- 当月活动参与数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, snapshot_date)
);

-- 3. Diagnosis Cache — 诊断结果 + 行动建议
CREATE TABLE IF NOT EXISTS diagnosis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name VARCHAR(255),
  diagnosis_type VARCHAR(50) NOT NULL,    -- 'coverage_gap' | 'dormant' | 'low_activity' | 'capability_gap'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',  -- 'high' | 'medium' | 'low'
  action_type VARCHAR(50),                -- 'recruit' | 'activate' | 'train' | 'review'
  action_label VARCHAR(255),
  action_route VARCHAR(255),              -- 前端路由参数，如 /partners?region=EastChina&status=Potential
  score_delta INTEGER DEFAULT 0,          -- 对健康分的影响
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. Partner Health Bar Config（健康条配置）
CREATE TABLE IF NOT EXISTS health_bar_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(100),
  tier VARCHAR(50),
  min_coverage INTEGER DEFAULT 0,
  min_vitality INTEGER DEFAULT 0,
  min_capability INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO health_bar_config (region, tier, min_coverage, min_vitality, min_capability) VALUES
  ('华北', 'Platinum', 80, 75, 80),
  ('华北', 'Gold', 70, 65, 70),
  ('华北', 'Silver', 60, 55, 60),
  ('华东', 'Platinum', 85, 80, 85),
  ('华东', 'Gold', 75, 70, 75),
  ('华东', 'Silver', 65, 60, 65),
  ('华南', 'Platinum', 80, 75, 80),
  ('华南', 'Gold', 70, 65, 70),
  ('华南', 'Silver', 60, 55, 60),
  ('西部', 'Gold', 65, 60, 65),
  ('西部', 'Silver', 55, 50, 55),
  ('华中', 'Gold', 65, 60, 65)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_scores_partner_date ON partner_scores(partner_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_diagnosis_cache_partner ON diagnosis_cache(partner_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_cache_type ON diagnosis_cache(diagnosis_type);
CREATE INDEX IF NOT EXISTS idx_diagnosis_cache_resolved ON diagnosis_cache(is_resolved);
