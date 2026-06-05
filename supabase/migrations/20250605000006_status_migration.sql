-- Migration: 统一状态为"草稿"、"已提交"、"已批复"三种
-- 在 Supabase SQL Editor 中执行: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/sql/new

CREATE TABLE IF NOT EXISTS incentive_annual_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), year INT NOT NULL,
  total_budget DECIMAL(12,2) DEFAULT 0, q1_budget DECIMAL(12,2) DEFAULT 0,
  q2_budget DECIMAL(12,2) DEFAULT 0, q3_budget DECIMAL(12,2) DEFAULT 0,
  q4_budget DECIMAL(12,2) DEFAULT 0, total_used DECIMAL(12,2) DEFAULT 0,
  total_remaining DECIMAL(12,2) DEFAULT 0, status TEXT DEFAULT 'draft',
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_iab_year ON incentive_annual_budget(year);

CREATE TABLE IF NOT EXISTS incentive_quarterly_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), year INT NOT NULL,
  quarter TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
  category TEXT DEFAULT 'volume_rebate', scope TEXT DEFAULT 'global',
  target_partner_ids TEXT[] DEFAULT '{}', target_partner_names TEXT[] DEFAULT '{}',
  total_budget DECIMAL(12,2) DEFAULT 0, approved_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft', start_date DATE, end_date DATE,
  targets JSONB DEFAULT '[]', direction JSONB DEFAULT '{}', pace JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ, approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_iqp_year ON incentive_quarterly_plan(year);
CREATE INDEX IF NOT EXISTS idx_iqp_quarter ON incentive_quarterly_plan(quarter);

CREATE TABLE IF NOT EXISTS incentive_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES incentive_quarterly_plan(id) ON DELETE CASCADE,
  partner_id TEXT, partner_name TEXT, partner_tier TEXT,
  achieved_value DECIMAL(12,2) DEFAULT 0, metric TEXT,
  payout_amount DECIMAL(12,2) DEFAULT 0, payout_status TEXT DEFAULT 'pending',
  related_deals TEXT[] DEFAULT '{}', related_leads TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT NOW(), approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ, notes TEXT
);

CREATE TABLE IF NOT EXISTS incentive_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES incentive_quarterly_plan(id) ON DELETE CASCADE,
  participation_rate DECIMAL(5,2) DEFAULT 0, achievement_rate DECIMAL(5,2) DEFAULT 0,
  roi DECIMAL(10,2) DEFAULT 0, total_payout DECIMAL(12,2) DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0, pipeline_created INT DEFAULT 0,
  pipeline_value DECIMAL(12,2) DEFAULT 0, scores JSONB DEFAULT '{}',
  summary TEXT, feedback TEXT, evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate old statuses
UPDATE incentive_quarterly_plan SET status = 'approved', updated_at = NOW() WHERE status IN ('in_progress', 'completed');
UPDATE incentive_quarterly_plan SET status = 'draft', updated_at = NOW() WHERE status = 'cancelled';

-- RLS
ALTER TABLE incentive_annual_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_quarterly_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_evaluations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['incentive_annual_budget','incentive_quarterly_plan','incentive_executions','incentive_evaluations'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow read %s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow read %s" ON %I FOR SELECT USING (auth.role() = ''authenticated'')', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow insert %s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow insert %s" ON %I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow update %s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow update %s" ON %I FOR UPDATE USING (auth.role() = ''authenticated'')', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow delete %s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow delete %s" ON %I FOR DELETE USING (auth.role() = ''authenticated'')', tbl, tbl);
  END LOOP;
END $$;
