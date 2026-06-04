-- Marketing Plan & Budget Management Tables
-- These tables support the /marketing/plan page and related marketing features.
-- Previously created manually via Supabase dashboard; now formalized as a migration.

-- ─── Global Settings ──────────────────────────────────
-- Stores global configuration like currency preference.
CREATE TABLE IF NOT EXISTS global_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  currency TEXT DEFAULT 'CNY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default row
INSERT INTO global_settings (id, currency) VALUES ('default', 'CNY')
  ON CONFLICT (id) DO NOTHING;

-- ─── Marketing Budget Config ──────────────────────────
-- Stores annual/quarterly budget, approval status, and adjustment amounts.
-- Only one row exists (id = 'current').
CREATE TABLE IF NOT EXISTS marketing_budget_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  annual_budget DECIMAL(12,2) DEFAULT 0,
  q1_budget DECIMAL(12,2) DEFAULT 0,
  q2_budget DECIMAL(12,2) DEFAULT 0,
  q3_budget DECIMAL(12,2) DEFAULT 0,
  q4_budget DECIMAL(12,2) DEFAULT 0,
  q1_adjust DECIMAL(12,2) DEFAULT 0,
  q2_adjust DECIMAL(12,2) DEFAULT 0,
  q3_adjust DECIMAL(12,2) DEFAULT 0,
  q4_adjust DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default budget config row
INSERT INTO marketing_budget_config (id, annual_budget, q1_budget, q2_budget, q3_budget, q4_budget, status)
VALUES ('current', 2000000, 500000, 500000, 500000, 500000, 'draft')
  ON CONFLICT (id) DO NOTHING;

-- ─── Marketing Plan ───────────────────────────────────
-- Stores planned marketing activities per year and quarter.
-- Links to partners table for PMDF (partner co-hosted) activities.
CREATE TABLE IF NOT EXISTS marketing_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  quarter TEXT NOT NULL,
  activity_type TEXT DEFAULT 'Marketing',
  partner_id TEXT,
  partner_name TEXT,
  category TEXT DEFAULT '线下峰会',
  region TEXT,
  city TEXT,
  expected_date DATE,
  total_budget DECIMAL(12,2) DEFAULT 0,
  approved_amount DECIMAL(12,2) DEFAULT 0,
  expected_attendees INT DEFAULT 0,
  expected_output TEXT,
  responsible_person TEXT,
  goal TEXT,
  execution_status TEXT DEFAULT 'Planning',
  plan_status TEXT DEFAULT 'draft',
  budget DECIMAL(12,2) DEFAULT 0,
  target_leads INT DEFAULT 0,
  target_opps INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for marketing_plan
CREATE INDEX IF NOT EXISTS idx_marketing_plan_year ON marketing_plan(year);
CREATE INDEX IF NOT EXISTS idx_marketing_plan_quarter ON marketing_plan(quarter);
CREATE INDEX IF NOT EXISTS idx_marketing_plan_year_quarter ON marketing_plan(year, quarter);

-- ─── Budget Change Log ────────────────────────────────
-- Tracks all changes to the marketing budget for audit trail.
CREATE TABLE IF NOT EXISTS budget_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id TEXT NOT NULL DEFAULT 'current',
  action TEXT NOT NULL,
  q1_budget DECIMAL(12,2) DEFAULT 0,
  q2_budget DECIMAL(12,2) DEFAULT 0,
  q3_budget DECIMAL(12,2) DEFAULT 0,
  q4_budget DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_change_log_config ON budget_change_log(config_id);
CREATE INDEX IF NOT EXISTS idx_budget_change_log_created ON budget_change_log(created_at DESC);

-- ─── Add missing columns to marketing_activities ──────
-- The marketing_activities table already exists from initial migration,
-- but additional columns were added later. Add them if they don't exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'host_type') THEN
    ALTER TABLE marketing_activities ADD COLUMN host_type TEXT DEFAULT 'vendor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'partner_id') THEN
    ALTER TABLE marketing_activities ADD COLUMN partner_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'partner_name') THEN
    ALTER TABLE marketing_activities ADD COLUMN partner_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'location') THEN
    ALTER TABLE marketing_activities ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'description') THEN
    ALTER TABLE marketing_activities ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'contact_name') THEN
    ALTER TABLE marketing_activities ADD COLUMN contact_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'contact_phone') THEN
    ALTER TABLE marketing_activities ADD COLUMN contact_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'max_attendees') THEN
    ALTER TABLE marketing_activities ADD COLUMN max_attendees INT DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_questions') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_questions BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_lottery') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_lottery BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'lottery_reward') THEN
    ALTER TABLE marketing_activities ADD COLUMN lottery_reward TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'signup_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN signup_points INT DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'checkin_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN checkin_points INT DEFAULT 20;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'invitation_code') THEN
    ALTER TABLE marketing_activities ADD COLUMN invitation_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'expected_attendees') THEN
    ALTER TABLE marketing_activities ADD COLUMN expected_attendees INT DEFAULT 0;
  END IF;
END $$;

-- ─── Row Level Security ────────────────────────────────
ALTER TABLE marketing_budget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read marketing_budget_config" ON marketing_budget_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow upsert marketing_budget_config" ON marketing_budget_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update marketing_budget_config" ON marketing_budget_config FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read marketing_plan" ON marketing_plan FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert marketing_plan" ON marketing_plan FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update marketing_plan" ON marketing_plan FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete marketing_plan" ON marketing_plan FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read budget_change_log" ON budget_change_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert budget_change_log" ON budget_change_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow read global_settings" ON global_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow upsert global_settings" ON global_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update global_settings" ON global_settings FOR UPDATE USING (auth.role() = 'authenticated');
