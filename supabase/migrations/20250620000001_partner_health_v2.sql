-- ═════════════════════════════════════════════════════════════════════════
-- Partner Health System v2 — Vitality Scoring & Coverage Diagnosis
-- 遵循蓝图：活跃度评分 + 覆盖诊断 + 行动中心
-- ═════════════════════════════════════════════════════════════════════════

-- 1. 合作伙伴行为明细表 — 记录所有互动证据
CREATE TABLE IF NOT EXISTS partner_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'LOGIN', 'LEAD_SUBMIT', 'MDF_CLAIM', 'TRAINING', 'DEAL_WIN', 'ACTIVITY_JOIN'
  )),
  weight_score INTEGER NOT NULL DEFAULT 0,
  activity_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_partner_time
  ON partner_activity_logs(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type_time
  ON partner_activity_logs(activity_type, created_at DESC);

-- 活跃度行为权重配置（不在 SQL 中，在前端引擎中定义）
-- LOGIN=1, LEAD_SUBMIT=10, MDF_CLAIM=15, TRAINING=5, DEAL_WIN=20, ACTIVITY_JOIN=8

-- 2. 区域/行业潜力基准表 — 诊断覆盖空白
CREATE TABLE IF NOT EXISTS market_benchmarks (
  id SERIAL PRIMARY KEY,
  region VARCHAR(100) NOT NULL,
  industry VARCHAR(100),
  target_revenue BIGINT DEFAULT 0,      -- 区域年度目标GMV
  required_partners INTEGER DEFAULT 0,   -- 理想伙伴覆盖数
  partner_density DECIMAL(5,2) DEFAULT 0, -- 每千万GMV需伙伴数
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(region, industry)
);

-- Seed 数据：基于实际市场规模的基准
INSERT INTO market_benchmarks (region, industry, target_revenue, required_partners, partner_density) VALUES
  ('华东', '金融', 100000000, 10, 1.0),
  ('华东', '医疗', 70000000, 8, 1.14),
  ('华东', '制造', 50000000, 6, 1.2),
  ('华东', '政务', 40000000, 5, 1.25),
  ('华北', '金融', 80000000, 8, 1.0),
  ('华北', '政务', 60000000, 6, 1.0),
  ('华北', '医疗', 40000000, 5, 1.25),
  ('华南', '金融', 60000000, 6, 1.0),
  ('华南', '政务', 50000000, 5, 1.0),
  ('华南', '医疗', 40000000, 5, 1.25),
  ('西部', '政务', 30000000, 4, 1.33),
  ('西部', '能源', 25000000, 3, 1.2),
  ('华中', '医疗', 20000000, 3, 1.5),
  ('华中', '政务', 15000000, 2, 1.33)
ON CONFLICT (region, industry) DO NOTHING;

-- 3. Seed 活动日志（让页面有数据可展示）
INSERT INTO partner_activity_logs (partner_id, activity_type, weight_score, created_at)
SELECT p.id, 'LOGIN', 1, (p.start_date::timestamp + interval '1 day' + (random()*30||' days')::interval)
FROM partners p WHERE p.status = 'Cooperating'
UNION ALL
SELECT p.id, 'LEAD_SUBMIT', 10, (p.start_date::timestamp + interval '15 days' + (random()*60||' days')::interval)
FROM partners p WHERE p.tier IN ('Platinum', 'Gold')
UNION ALL
SELECT p.id, 'DEAL_WIN', 20, (p.start_date::timestamp + interval '30 days' + (random()*90||' days')::interval)
FROM partners p WHERE p.win_rate > 50
UNION ALL
SELECT p.id, 'MDF_CLAIM', 15, (p.start_date::timestamp + interval '45 days' + (random()*60||' days')::interval)
FROM partners p WHERE p.tier IN ('Platinum', 'Diamond', 'Gold')
UNION ALL
SELECT p.id, 'TRAINING', 5, (p.start_date::timestamp + interval '20 days' + (random()*45||' days')::interval)
FROM partners p WHERE p.status = 'Cooperating';
