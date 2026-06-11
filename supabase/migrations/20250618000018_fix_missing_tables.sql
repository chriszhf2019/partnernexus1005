-- Fix: Add missing columns to deals table + create missing system tables
-- 在 Supabase SQL Editor 中执行

-- ══════════════════════════════════════════════════════════
-- 1. deals 表增加缺失列
-- ══════════════════════════════════════════════════════════
DO $$
BEGIN
  -- stage: 商机阶段（前端重度使用但DB缺失）
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='stage') THEN
    ALTER TABLE deals ADD COLUMN stage TEXT DEFAULT 'Registered';
  END IF;
  -- customer_industry
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='customer_industry') THEN
    ALTER TABLE deals ADD COLUMN customer_industry TEXT DEFAULT '';
  END IF;
  -- province
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='province') THEN
    ALTER TABLE deals ADD COLUMN province TEXT DEFAULT '';
  END IF;
  -- city
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='city') THEN
    ALTER TABLE deals ADD COLUMN city TEXT DEFAULT '';
  END IF;
  -- notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='notes') THEN
    ALTER TABLE deals ADD COLUMN notes TEXT;
  END IF;
  -- next_action
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='next_action') THEN
    ALTER TABLE deals ADD COLUMN next_action TEXT;
  END IF;
  -- next_action_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='next_action_date') THEN
    ALTER TABLE deals ADD COLUMN next_action_date TEXT;
  END IF;
  -- actual_close_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='actual_close_date') THEN
    ALTER TABLE deals ADD COLUMN actual_close_date DATE;
  END IF;
  -- conflict_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='conflict_id') THEN
    ALTER TABLE deals ADD COLUMN conflict_id TEXT;
  END IF;
  -- last_activity_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='last_activity_date') THEN
    ALTER TABLE deals ADD COLUMN last_activity_date DATE;
  END IF;
  -- origin_activity_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='origin_activity_id') THEN
    ALTER TABLE deals ADD COLUMN origin_activity_id TEXT;
  END IF;
  -- origin_activity_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='origin_activity_name') THEN
    ALTER TABLE deals ADD COLUMN origin_activity_name TEXT;
  END IF;
  -- origin_invitation_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='origin_invitation_code') THEN
    ALTER TABLE deals ADD COLUMN origin_invitation_code TEXT;
  END IF;
  -- health_score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='health_score') THEN
    ALTER TABLE deals ADD COLUMN health_score INT DEFAULT 50;
  END IF;
  -- lead_response_time
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='lead_response_time') THEN
    ALTER TABLE deals ADD COLUMN lead_response_time INT;
  END IF;
  -- is_new_logo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='is_new_logo') THEN
    ALTER TABLE deals ADD COLUMN is_new_logo BOOLEAN DEFAULT false;
  END IF;
  -- protection_remaining_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='protection_remaining_days') THEN
    ALTER TABLE deals ADD COLUMN protection_remaining_days INT;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════
-- 2. 创建 partner_operation_logs 表（操作审计日志）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS partner_operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  operator TEXT DEFAULT 'system',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_operation_logs_partner ON partner_operation_logs(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON partner_operation_logs(action);

-- ══════════════════════════════════════════════════════════
-- 3. 创建 jbp_meetings 表（JBP 联合业务规划会议）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jbp_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'regular',
  meeting_date DATE,
  location TEXT,
  duration TEXT,
  objectives TEXT[] DEFAULT '{}',
  participants JSONB DEFAULT '[]',
  agenda JSONB DEFAULT '[]',
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jbp_partner ON jbp_meetings(partner_id, meeting_date DESC);

-- ══════════════════════════════════════════════════════════
-- 4. 创建 marketing_budget_config 表（营销预算配置）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS marketing_budget_config (
  id TEXT PRIMARY KEY DEFAULT 'current',
  annual_budget DECIMAL(14,2) DEFAULT 0,
  q1_budget DECIMAL(14,2) DEFAULT 0,
  q2_budget DECIMAL(14,2) DEFAULT 0,
  q3_budget DECIMAL(14,2) DEFAULT 0,
  q4_budget DECIMAL(14,2) DEFAULT 0,
  q1_spent DECIMAL(14,2) DEFAULT 0,
  q2_spent DECIMAL(14,2) DEFAULT 0,
  q3_spent DECIMAL(14,2) DEFAULT 0,
  q4_spent DECIMAL(14,2) DEFAULT 0,
  adjustment_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- 5. 创建 marketing_campaigns 表（活动管理）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'vendor_self',
  host_type TEXT DEFAULT 'vendor',
  year INT DEFAULT EXTRACT(YEAR FROM NOW()),
  quarter TEXT DEFAULT 'Q1',
  category TEXT,
  region TEXT,
  city TEXT,
  budget DECIMAL(12,2) DEFAULT 0,
  actual_spend DECIMAL(12,2) DEFAULT 0,
  approved_amount DECIMAL(12,2),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  expected_attendees INT DEFAULT 0,
  actual_attendees INT DEFAULT 0,
  registered_count INT DEFAULT 0,
  checked_in_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft',
  current_phase TEXT DEFAULT 'planning',
  partner_id TEXT,
  partner_name TEXT,
  responsible_person TEXT,
  description TEXT,
  goals JSONB DEFAULT '[]',
  expected_outputs TEXT,
  leads_generated INT DEFAULT 0,
  deals_created INT DEFAULT 0,
  deals_value DECIMAL(12,2) DEFAULT 0,
  has_evaluation BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_date ON marketing_campaigns(planned_start_date);

-- ══════════════════════════════════════════════════════════
-- 6. 创建 incentive_quarterly_plans 表（季度激励计划）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS incentive_quarterly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'volume_rebate',
  scope TEXT DEFAULT 'global',
  target_partner_ids TEXT[] DEFAULT '{}',
  target_partner_names TEXT[] DEFAULT '{}',
  total_budget DECIMAL(12,2) DEFAULT 0,
  approved_amount DECIMAL(12,2),
  status TEXT DEFAULT 'draft',
  direction JSONB DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  targets JSONB DEFAULT '[]',
  tier_rules JSONB DEFAULT '[]',
  targeting_rules JSONB DEFAULT '[]',
  pace JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incentive_quarterly_plans ON incentive_quarterly_plans(year, quarter);

-- ══════════════════════════════════════════════════════════
-- 7. 创建 incentive_applications 表（激励申请）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS incentive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES incentive_quarterly_plans(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  partner_name TEXT,
  partner_tier TEXT,
  metric TEXT,
  claimed_value DECIMAL(12,2) DEFAULT 0,
  payout_amount DECIMAL(12,2) DEFAULT 0,
  related_deals JSONB DEFAULT '[]',
  supporting_documents JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  current_step INT DEFAULT 0,
  workflow_steps JSONB DEFAULT '[]',
  approval_history JSONB DEFAULT '[]',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_plan ON incentive_applications(plan_id);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_partner ON incentive_applications(partner_id);

-- ══════════════════════════════════════════════════════════
-- 8. 创建 incentive_evaluations 表（激励评估）
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS incentive_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES incentive_quarterly_plans(id) ON DELETE CASCADE,
  participation_rate DECIMAL(5,2) DEFAULT 0,
  achievement_rate DECIMAL(5,2) DEFAULT 0,
  per_metric_achievement JSONB DEFAULT '[]',
  roi DECIMAL(5,2),
  total_payout DECIMAL(12,2) DEFAULT 0,
  total_revenue DECIMAL(12,2),
  pipeline_created INT DEFAULT 0,
  pipeline_value DECIMAL(12,2),
  cost_per_deal DECIMAL(12,2),
  fairness_metrics JSONB DEFAULT '{}',
  satisfaction_metrics JSONB DEFAULT '{}',
  scores JSONB DEFAULT '{}',
  summary TEXT,
  feedback TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  evaluator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incentive_evaluations_plan ON incentive_evaluations(plan_id);
