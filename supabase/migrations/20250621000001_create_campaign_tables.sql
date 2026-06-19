-- Migration: Create missing campaign-related tables
-- 执行方式: 在 Supabase Dashboard SQL Editor 中执行

-- ══════════════════════════════════════════════════════════
-- 1. campaign_attendees - 活动参会人员
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  position TEXT,
  phone TEXT,
  email TEXT,
  source TEXT DEFAULT 'registration',
  attendee_type TEXT DEFAULT 'prospect',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  total_points INT DEFAULT 0,
  status TEXT DEFAULT 'registered',
  interest_topics TEXT[] DEFAULT '{}',
  follow_up_status TEXT,
  deal_created BOOLEAN DEFAULT false,
  deal_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_attendees_campaign ON campaign_attendees(campaign_id, registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_attendees_status ON campaign_attendees(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_attendees_checkin ON campaign_attendees(campaign_id, checked_in);

-- ══════════════════════════════════════════════════════════
-- 2. campaign_registrations - 活动报名记录
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  attendee_id UUID,
  attendee_name TEXT NOT NULL,
  attendee_company TEXT DEFAULT '',
  attendee_phone TEXT,
  attendee_email TEXT,
  registration_channel TEXT,
  registration_time TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_registrations_campaign ON campaign_registrations(campaign_id, registration_time DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_registrations_status ON campaign_registrations(campaign_id, status);

-- ══════════════════════════════════════════════════════════
-- 3. campaign_point_records - 活动积分记录
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_point_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  attendee_id UUID,
  attendee_name TEXT DEFAULT '',
  source TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_point_records_campaign ON campaign_point_records(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_point_records_attendee ON campaign_point_records(attendee_id, campaign_id);

-- ══════════════════════════════════════════════════════════
-- 4. annual_marketing_budgets - 年度营销预算
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS annual_marketing_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  total_budget DECIMAL(14,2) DEFAULT 0,
  total_spent DECIMAL(14,2) DEFAULT 0,
  remaining DECIMAL(14,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year)
);
CREATE INDEX IF NOT EXISTS idx_annual_marketing_budgets_year ON annual_marketing_budgets(year);

-- ══════════════════════════════════════════════════════════
-- 5. quarterly_budgets - 季度预算
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS quarterly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_budget_id UUID REFERENCES annual_marketing_budgets(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  allocated_budget DECIMAL(14,2) DEFAULT 0,
  spent DECIMAL(14,2) DEFAULT 0,
  remaining DECIMAL(14,2) DEFAULT 0,
  campaign_count INT DEFAULT 0,
  expected_attendees INT DEFAULT 0,
  actual_attendees INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annual_budget_id, quarter)
);
CREATE INDEX IF NOT EXISTS idx_quarterly_budgets_annual ON quarterly_budgets(annual_budget_id);

-- ══════════════════════════════════════════════════════════
-- 6. category_budgets - 分类预算
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_budget_id UUID REFERENCES annual_marketing_budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  allocated_budget DECIMAL(14,2) DEFAULT 0,
  spent DECIMAL(14,2) DEFAULT 0,
  remaining DECIMAL(14,2) DEFAULT 0,
  campaign_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(annual_budget_id, category)
);
CREATE INDEX IF NOT EXISTS idx_category_budgets_annual ON category_budgets(annual_budget_id);

-- ══════════════════════════════════════════════════════════
-- 7. campaign_evaluations - 活动评估
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  overall_quality DECIMAL(3,1) DEFAULT 0,
  dimensions JSONB DEFAULT '[]',
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  lead_conversion_rate DECIMAL(5,2) DEFAULT 0,
  deal_conversion_rate DECIMAL(5,2) DEFAULT 0,
  attendee_satisfaction DECIMAL(3,1) DEFAULT 0,
  roi DECIMAL(5,2) DEFAULT 0,
  strengths TEXT,
  improvements TEXT,
  evaluator TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_evaluations_campaign ON campaign_evaluations(campaign_id);

-- ══════════════════════════════════════════════════════════
-- 8. campaign_mini_app_configs - 小程序配置
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_mini_app_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  allow_registration BOOLEAN DEFAULT true,
  allow_check_in BOOLEAN DEFAULT true,
  allow_questions BOOLEAN DEFAULT true,
  allow_lottery BOOLEAN DEFAULT false,
  allow_sharing BOOLEAN DEFAULT true,
  allow_feedback BOOLEAN DEFAULT true,
  signup_points INT DEFAULT 10,
  check_in_points INT DEFAULT 20,
  question_points INT DEFAULT 5,
  lottery_points INT DEFAULT 10,
  sharing_points INT DEFAULT 5,
  feedback_points INT DEFAULT 10,
  max_attendees INT,
  registration_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_mini_app_configs_campaign ON campaign_mini_app_configs(campaign_id);

-- ══════════════════════════════════════════════════════════
-- 9. campaign_invitations - 活动邀请
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_company TEXT DEFAULT '',
  invitee_email TEXT,
  invitee_phone TEXT,
  invitation_code TEXT UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response TEXT,
  registered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_campaign ON campaign_invitations(campaign_id, invited_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_code ON campaign_invitations(invitation_code);

-- ══════════════════════════════════════════════════════════
-- 10. campaign_phase_tasks - 阶段任务
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_phase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  phase TEXT DEFAULT 'planning',
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  assignee TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  task_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_phase_tasks_campaign ON campaign_phase_tasks(campaign_id, phase);
CREATE INDEX IF NOT EXISTS idx_campaign_phase_tasks_status ON campaign_phase_tasks(campaign_id, status);

-- ══════════════════════════════════════════════════════════
-- 11. campaign_feedback - 活动反馈
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  attendee_id UUID,
  attendee_name TEXT DEFAULT '',
  attendee_company TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  content TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_anonymity BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_feedback_campaign ON campaign_feedback(campaign_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_feedback_rating ON campaign_feedback(campaign_id, rating);

-- ══════════════════════════════════════════════════════════
-- 12. campaign_questions - 活动提问
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  attendee_id UUID,
  attendee_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  answer TEXT,
  answered_by TEXT,
  answered_at TIMESTAMPTZ,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_questions_campaign ON campaign_questions(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_questions_answered ON campaign_questions(campaign_id, is_answered);

-- ══════════════════════════════════════════════════════════
-- 13. campaign_deal_links - 活动与商机关联
-- ══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS campaign_deal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  attendee_id UUID REFERENCES campaign_attendees(id) ON DELETE SET NULL,
  attendee_name TEXT DEFAULT '',
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'potential',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_deal_links_campaign ON campaign_deal_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_deal_links_deal ON campaign_deal_links(deal_id);

-- ══════════════════════════════════════════════════════════
-- 14. customer_intelligence - 客户情报（如果不存在）
-- ══════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_intelligence') THEN
    CREATE TABLE IF NOT EXISTS customer_intelligence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name TEXT NOT NULL,
      industry TEXT,
      region TEXT,
      city TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      total_projects INT DEFAULT 0,
      total_value DECIMAL(14,2) DEFAULT 0,
      active_deals INT DEFAULT 0,
      competitors TEXT[] DEFAULT '{}',
      last_activity_date DATE,
      tags TEXT[] DEFAULT '{}',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_customer_intelligence_name ON customer_intelligence(customer_name);
    CREATE INDEX IF NOT EXISTS idx_customer_intelligence_industry ON customer_intelligence(industry);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════
-- 添加 RLS 策略（行级安全策略）
-- ══════════════════════════════════════════════════════════

-- 启用 RLS
ALTER TABLE campaign_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_point_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_marketing_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_mini_app_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_phase_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_deal_links ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略（根据需要调整）
CREATE POLICY "Allow all operations on campaign_attendees" ON campaign_attendees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_registrations" ON campaign_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_point_records" ON campaign_point_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on annual_marketing_budgets" ON annual_marketing_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on quarterly_budgets" ON quarterly_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on category_budgets" ON category_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_evaluations" ON campaign_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_mini_app_configs" ON campaign_mini_app_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_invitations" ON campaign_invitations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_phase_tasks" ON campaign_phase_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_feedback" ON campaign_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_questions" ON campaign_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on campaign_deal_links" ON campaign_deal_links FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════
-- 完成提示
-- ══════════════════════════════════════════════════════════
-- 执行完成后，所有活动相关的表都已创建。
-- 如需查看表列表，可以运行: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
