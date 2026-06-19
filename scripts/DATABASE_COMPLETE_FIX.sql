-- =====================================================================
-- Partner Management System - 数据库完整修复脚本
-- 执行方式: 在 Supabase Dashboard → SQL Editor 中一次性执行
-- 日期: 2025-06-21
-- 说明: 本脚本创建了所有前端代码中引用但缺失的数据库表，并填充示例数据
-- =====================================================================

-- =====================================================================
-- 第一部分: 营销活动相关表 (13张)
-- =====================================================================

-- 1. campaign_attendees - 活动参会人员
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
ALTER TABLE campaign_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_attendees" ON campaign_attendees FOR ALL USING (true) WITH CHECK (true);

-- 2. campaign_registrations - 活动报名记录
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
ALTER TABLE campaign_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_registrations" ON campaign_registrations FOR ALL USING (true) WITH CHECK (true);

-- 3. campaign_point_records - 活动积分记录
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
ALTER TABLE campaign_point_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_point_records" ON campaign_point_records FOR ALL USING (true) WITH CHECK (true);

-- 4. annual_marketing_budgets - 年度营销预算
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
ALTER TABLE annual_marketing_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on annual_marketing_budgets" ON annual_marketing_budgets FOR ALL USING (true) WITH CHECK (true);

-- 5. quarterly_budgets - 季度预算
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
ALTER TABLE quarterly_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on quarterly_budgets" ON quarterly_budgets FOR ALL USING (true) WITH CHECK (true);

-- 6. category_budgets - 分类预算
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
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on category_budgets" ON category_budgets FOR ALL USING (true) WITH CHECK (true);

-- 7. campaign_evaluations - 活动评估
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
ALTER TABLE campaign_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_evaluations" ON campaign_evaluations FOR ALL USING (true) WITH CHECK (true);

-- 8. campaign_mini_app_configs - 小程序配置
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
ALTER TABLE campaign_mini_app_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_mini_app_configs" ON campaign_mini_app_configs FOR ALL USING (true) WITH CHECK (true);

-- 9. campaign_invitations - 活动邀请
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
ALTER TABLE campaign_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_invitations" ON campaign_invitations FOR ALL USING (true) WITH CHECK (true);

-- 10. campaign_phase_tasks - 阶段任务
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
ALTER TABLE campaign_phase_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_phase_tasks" ON campaign_phase_tasks FOR ALL USING (true) WITH CHECK (true);

-- 11. campaign_feedback - 活动反馈
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
ALTER TABLE campaign_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_feedback" ON campaign_feedback FOR ALL USING (true) WITH CHECK (true);

-- 12. campaign_questions - 活动提问
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
ALTER TABLE campaign_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_questions" ON campaign_questions FOR ALL USING (true) WITH CHECK (true);

-- 13. campaign_deal_links - 活动与商机关联
CREATE TABLE IF NOT EXISTS campaign_deal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  deal_id UUID,
  attendee_id UUID REFERENCES campaign_attendees(id) ON DELETE SET NULL,
  attendee_name TEXT DEFAULT '',
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'potential',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaign_deal_links_campaign ON campaign_deal_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_deal_links_deal ON campaign_deal_links(deal_id);
ALTER TABLE campaign_deal_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on campaign_deal_links" ON campaign_deal_links FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 第二部分: 培训与认证相关表 (5张)
-- =====================================================================

-- 14. notifications - 系统通知
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  category TEXT,
  priority INT DEFAULT 0,
  read BOOLEAN DEFAULT false,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 15. certification_programs - 认证课程
CREATE TABLE IF NOT EXISTS certification_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  level TEXT,
  description TEXT,
  objectives TEXT,
  target_audience TEXT,
  duration TEXT,
  assessment_count INT DEFAULT 0,
  prerequisites TEXT,
  points INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_certification_programs_cat ON certification_programs(category, level);
ALTER TABLE certification_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on certification_programs" ON certification_programs FOR ALL USING (true) WITH CHECK (true);

-- 16. user_enrollments - 用户报名
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  company TEXT,
  status TEXT DEFAULT 'enrolled',
  progress INT DEFAULT 0,
  score INT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_program ON user_enrollments(program_name);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user ON user_enrollments(user_name);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_activity ON user_enrollments(last_activity DESC);
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on user_enrollments" ON user_enrollments FOR ALL USING (true) WITH CHECK (true);

-- 17. assessment_records - 考核记录
CREATE TABLE IF NOT EXISTS assessment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  company TEXT,
  type TEXT DEFAULT 'pre',
  score INT DEFAULT 0,
  level TEXT,
  answers JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assessment_records_program ON assessment_records(program_name);
CREATE INDEX IF NOT EXISTS idx_assessment_records_user ON assessment_records(user_name);
ALTER TABLE assessment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on assessment_records" ON assessment_records FOR ALL USING (true) WITH CHECK (true);

-- 18. course_feedback - 课程反馈
CREATE TABLE IF NOT EXISTS course_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  company TEXT,
  program_name TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 5.0,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_feedback_program ON course_feedback(program_name);
CREATE INDEX IF NOT EXISTS idx_course_feedback_rating ON course_feedback(rating);
ALTER TABLE course_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all on course_feedback" ON course_feedback FOR ALL USING (true) WITH CHECK (true);

-- =====================================================================
-- 第三部分: 种子数据 - 营销活动示例数据
-- =====================================================================

INSERT INTO marketing_campaigns (id, name, type, host_type, year, quarter, category, region, city, budget, actual_spend, approved_amount, planned_start_date, planned_end_date, actual_start_date, actual_end_date, expected_attendees, actual_attendees, registered_count, checked_in_count, status, current_phase, responsible_person, description, leads_generated, deals_created, deals_value) VALUES
  ('mc0000001-0000-0000-0000-000000000001', '2025年度合作伙伴峰会', 'partner_summit', 'vendor', 2025, 'Q1', '合作伙伴大会', '全国', '北京', 1500000.00, 1450000.00, 1500000.00, '2025-03-15', '2025-03-17', '2025-03-15', '2025-03-17', 500, 480, 520, 465, 'completed', 'execution', '渠道总监', '年度最重要的合作伙伴大会', 120, 35, 8500000.00),
  ('mc0000001-0000-0000-0000-000000000002', '云原生技术赋能培训', 'technical_training', 'vendor', 2025, 'Q1', '技术培训', '华东', '上海', 300000.00, 285000.00, 300000.00, '2025-01-20', '2025-01-22', '2025-01-20', '2025-01-22', 100, 92, 105, 88, 'completed', 'evaluation', '技术总监', '云原生技术深度培训', 45, 12, 2400000.00),
  ('mc0000001-0000-0000-0000-000000000003', 'Q2渠道拓展训练营', 'channel_training', 'vendor', 2025, 'Q2', '技术培训', '华南', '深圳', 250000.00, 80000.00, 250000.00, '2025-04-15', '2025-04-17', '2025-04-15', NULL, 80, 52, 68, 48, 'in_progress', 'execution', '区域经理', 'Q2渠道拓展专项训练', 28, 5, 1200000.00),
  ('mc0000001-0000-0000-0000-000000000004', '2025数字化营销研讨会', 'digital_marketing', 'vendor', 2025, 'Q2', '市场推广', '全国', '线上', 200000.00, 0, 200000.00, '2025-06-10', '2025-06-12', NULL, NULL, 200, 0, 0, 0, 'planning', 'planning', '市场经理', '数字化营销最佳实践', 0, 0, 0.00),
  ('mc0000001-0000-0000-0000-000000000005', '智能制造解决方案Workshop', 'solution_workshop', 'vendor', 2025, 'Q1', '技术培训', '华北', '北京', 180000.00, 175000.00, 180000.00, '2025-02-25', '2025-02-27', '2025-02-25', '2025-02-27', 60, 55, 62, 52, 'completed', 'evaluation', '解决方案总监', '智能制造解决方案深度研讨', 32, 8, 1600000.00)
ON CONFLICT DO NOTHING;

INSERT INTO campaign_attendees (id, campaign_id, name, company, position, phone, email, source, attendee_type, registered_at, checked_in, total_points, status, interest_topics, follow_up_status, deal_created) VALUES
  ('ca0000001-0000-0000-0000-000000000001', 'mc0000001-0000-0000-0000-000000000001', '张伟', '北京华泰信息技术有限公司', '总经理', '13800138001', 'zhangwei@huataitech.com', 'registration', 'partner', '2025-02-20 10:00:00', true, 150, 'attended', ARRAY['云原生', '智能制造', '渠道政策'], 'completed', true),
  ('ca0000001-0000-0000-0000-000000000002', 'mc0000001-0000-0000-0000-000000000001', '李娜', '上海云智科技有限公司', '销售总监', '13800138002', 'lina@yunzhitech.com', 'invitation', 'partner', '2025-02-18 14:30:00', true, 120, 'attended', ARRAY['云原生', '数字化转型'], 'in_progress', true),
  ('ca0000001-0000-0000-0000-000000000003', 'mc0000001-0000-0000-0000-000000000001', '王强', '深圳创新智联科技', '技术经理', '13800138003', 'wangqiang@cxzltech.com', 'registration', 'prospect', '2025-02-22 09:15:00', true, 100, 'attended', ARRAY['技术架构', '智能制造'], 'pending', false),
  ('ca0000001-0000-0000-0000-000000000004', 'mc0000001-0000-0000-0000-000000000001', '陈静', '广州智远数据服务', '市场总监', '13800138004', 'chenjing@zhiyuandata.com', 'invitation', 'partner', '2025-02-19 16:45:00', false, 30, 'registered', ARRAY['市场推广', '数字化营销'], 'pending', false),
  ('ca0000001-0000-0000-0000-000000000005', 'mc0000001-0000-0000-0000-000000000001', '刘洋', '杭州数字云科技', '总经理', '13800138005', 'liuyang@szcloudtech.com', 'registration', 'partner', '2025-02-21 11:20:00', true, 130, 'attended', ARRAY['云原生', '渠道政策', '市场推广'], 'completed', true),
  ('ca0000001-0000-0000-0000-000000000006', 'mc0000001-0000-0000-0000-000000000002', '赵磊', '北京华泰信息技术有限公司', '架构师', '13900139001', 'zhaolei@huataitech.com', 'registration', 'partner', '2025-01-05 10:00:00', true, 200, 'attended', ARRAY['云原生', 'K8s', '微服务'], 'completed', true),
  ('ca0000001-0000-0000-0000-000000000007', 'mc0000001-0000-0000-0000-000000000002', '孙丽', '上海云智科技有限公司', '技术负责人', '13900139002', 'sunli@yunzhitech.com', 'registration', 'partner', '2025-01-06 14:00:00', true, 180, 'attended', ARRAY['云原生', 'DevOps', '容器化'], 'completed', true),
  ('ca0000001-0000-0000-0000-000000000008', 'mc0000001-0000-0000-0000-000000000002', '周涛', '深圳创新智联科技', '开发工程师', '13900139003', 'zhoutao@cxzltech.com', 'invitation', 'prospect', '2025-01-08 09:30:00', true, 160, 'attended', ARRAY['K8s', '微服务'], 'in_progress', false),
  ('ca0000001-0000-0000-0000-000000000009', 'mc0000001-0000-0000-0000-000000000003', '吴刚', '广州智远数据服务', '区域经理', '13700137001', 'wugang@zhiyuandata.com', 'registration', 'partner', '2025-03-20 10:00:00', true, 80, 'attended', ARRAY['销售渠道', '客户开发'], 'in_progress', false),
  ('ca0000001-0000-0000-0000-000000000010', 'mc0000001-0000-0000-0000-000000000003', '郑敏', '杭州数字云科技', '销售主管', '13700137002', 'zhengmin@szcloudtech.com', 'invitation', 'partner', '2025-03-22 14:30:00', true, 70, 'attended', ARRAY['销售技巧', '商机管理'], 'pending', false)
ON CONFLICT DO NOTHING;

INSERT INTO annual_marketing_budgets (id, year, total_budget, total_spent, remaining, status, created_by) VALUES
  ('a0000001-0000-0000-0000-000000000001', 2024, 5000000.00, 4200000.00, 800000.00, 'closed', 'admin'),
  ('a0000001-0000-0000-0000-000000000002', 2025, 6000000.00, 1800000.00, 4200000.00, 'active', 'admin')
ON CONFLICT (year) DO NOTHING;

INSERT INTO quarterly_budgets (id, annual_budget_id, quarter, allocated_budget, spent, remaining, campaign_count, expected_attendees, actual_attendees) VALUES
  ('q0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Q1', 1200000.00, 1150000.00, 50000.00, 8, 800, 720),
  ('q0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Q2', 1300000.00, 1280000.00, 20000.00, 10, 1000, 950),
  ('q0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Q3', 1250000.00, 1100000.00, 150000.00, 6, 600, 580),
  ('q0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Q4', 1250000.00, 670000.00, 580000.00, 5, 500, 420),
  ('q0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'Q1', 1500000.00, 1450000.00, 50000.00, 12, 1200, 1100),
  ('q0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Q2', 1500000.00, 350000.00, 1150000.00, 6, 600, 520),
  ('q0000002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'Q3', 1500000.00, 0, 1500000.00, 0, 0, 0),
  ('q0000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Q4', 1500000.00, 0, 1500000.00, 0, 0, 0)
ON CONFLICT (annual_budget_id, quarter) DO NOTHING;

INSERT INTO category_budgets (id, annual_budget_id, category, allocated_budget, spent, remaining, campaign_count) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '合作伙伴大会', 2000000.00, 1950000.00, 50000.00, 5),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', '技术培训', 1500000.00, 1400000.00, 100000.00, 12),
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', '市场推广', 1000000.00, 850000.00, 150000.00, 8),
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', '数字化营销', 500000.00, 0, 500000.00, 0),
  ('c0000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', '合作伙伴大会', 2400000.00, 1200000.00, 1200000.00, 4),
  ('c0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', '技术培训', 1800000.00, 600000.00, 1200000.00, 10),
  ('c0000002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', '市场推广', 1200000.00, 0, 1200000.00, 0),
  ('c0000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', '数字化营销', 600000.00, 0, 600000.00, 0)
ON CONFLICT (annual_budget_id, category) DO NOTHING;

INSERT INTO campaign_evaluations (id, campaign_id, overall_quality, dimensions, conversion_rate, lead_conversion_rate, deal_conversion_rate, attendee_satisfaction, roi, strengths, improvements, evaluator, evaluated_at) VALUES
  ('ce0000001-0000-0000-0000-000000000001', 'mc0000001-0000-0000-0000-000000000001', 4.5, '["内容深度", "讲师水平", "互动环节", "场地设施"]', 24.0, 85.7, 29.2, 4.6, 5.7, '内容丰富，干货满满', '可增加更多实战演练', '市场经理', '2025-03-20 10:00:00'),
  ('ce0000001-0000-0000-0000-000000000002', 'mc0000001-0000-0000-0000-000000000002', 4.8, '["技术深度", "实操比例", "案例分析"]', 45.0, 100.0, 26.7, 4.9, 8.0, '云原生技术深入浅出', '可增加更多企业级场景案例', '技术总监', '2025-01-25 14:00:00')
ON CONFLICT (campaign_id) DO NOTHING;

INSERT INTO notifications (id, title, message, type, category, priority, read) VALUES
  ('n0000001-0000-0000-0000-000000000001', '欢迎使用合作伙伴管理平台', '您已成功登录系统。平台为您提供商机管理、合作伙伴管理、激励计划等核心功能。', 'info', '系统', 0, false),
  ('n0000001-0000-0000-0000-000000000002', '新激励计划已发布', '2025年Q2合作伙伴返现激励计划已正式发布，最高可获得15%的销售返现奖励。', 'announcement', '激励计划', 1, false),
  ('n0000001-0000-0000-0000-000000000003', '商机状态变更提醒', '您负责的商机「某银行数据中台项目」已变更为「审批中」状态。', 'alert', '商机', 2, false),
  ('n0000001-0000-0000-0000-000000000004', '培训课程上线通知', '「高级技术专家认证」课程已上线，欢迎各位合作伙伴技术人员报名参加。', 'info', '培训', 0, false),
  ('n0000001-0000-0000-0000-000000000005', 'MDF配额提醒', '您公司本月的MDF配额剩余50,000元，请及时提交活动申请。', 'alert', 'MDF', 1, false),
  ('n0000001-0000-0000-0000-000000000006', '合作伙伴峰会邀请', '2025年度合作伙伴峰会将于下周在北京举办，期待您的参与！', 'announcement', '活动', 2, false),
  ('n0000001-0000-0000-0000-000000000007', '系统维护通知', '系统将于本周六(6月20日)凌晨2-4点进行例行维护，期间可能无法访问。', 'info', '系统', 1, true),
  ('n0000001-0000-0000-0000-000000000008', '考核通过', '恭喜！您已成功通过「基础销售认证」考核，学分已自动计入您的学习档案。', 'success', '培训', 0, false),
  ('n0000001-0000-0000-0000-000000000009', '合作伙伴等级更新', '您所在的「北京华泰信息技术有限公司」已升级为金牌合作伙伴，恭喜！', 'success', '合作伙伴', 2, false),
  ('n0000001-0000-0000-0000-000000000010', '商机报备提醒', '请及时提交您跟进中的商机报备信息，以免影响后续激励申请。', 'alert', '商机', 1, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO certification_programs (id, name, category, level, description, objectives, target_audience, duration, assessment_count, prerequisites, points, is_active, usage_count) VALUES
  ('c0000001-0000-0000-0000-000000000001', '基础销售认证', 'Sales', 'Foundation', '掌握产品基础知识和销售方法论，能够独立完成产品演示和初步商机跟进。', '建立产品认知、掌握销售话术、熟悉商机管理流程', '新入职销售、初级合作伙伴销售人员', '2周', 2, '无', 100, true, 45),
  ('c0000001-0000-0000-0000-000000000002', '高级销售认证', 'Sales', 'Advanced', '深入掌握解决方案销售、客户痛点挖掘和大客户谈判技能，能够独立负责中型项目。', '掌握方案销售、提升谈判能力、建立客户管理体系', '1年以上销售经验、完成基础认证', '4周', 3, '基础销售认证', 200, true, 28),
  ('c0000001-0000-0000-0000-000000000003', '技术工程师认证', 'Technical', 'Professional', '掌握产品架构和技术原理，能够独立完成POC测试和技术方案设计。', '掌握产品架构、具备POC能力、能够编写技术方案', '售前工程师、技术支持、实施顾问', '3周', 3, '具备基础IT技能', 150, true, 32),
  ('c0000001-0000-0000-0000-000000000004', '高级技术专家认证', 'Technical', 'Expert', '深入理解产品底层原理，能够针对行业场景提供定制化技术方案，支持复杂客户需求。', '掌握高级架构、具备性能调优能力、能够处理复杂问题', '3年以上技术经验、完成技术工程师认证', '6周', 4, '技术工程师认证', 300, true, 15),
  ('c0000001-0000-0000-0000-000000000005', '合作伙伴管理认证', 'Management', 'Professional', '掌握合作伙伴招募、管理、激励和运营方法论，能够独立负责区域合作伙伴生态。', '掌握渠道管理、建立合作伙伴关系、提升运营能力', '渠道经理、合作伙伴运营人员', '3周', 2, '无', 180, true, 22),
  ('c0000001-0000-0000-0000-000000000006', '产品经理基础认证', 'Product', 'Foundation', '理解产品设计理念，能够参与产品规划和需求分析，有效支撑产品迭代。', '建立产品思维、学习需求分析、掌握产品工具', '产品人员、市场人员、合作伙伴产品对接人', '2周', 2, '无', 120, true, 18),
  ('c0000001-0000-0000-0000-000000000007', '行业解决方案专家', 'Industry', 'Expert', '深入理解特定行业业务场景，能够结合产品提供行业解决方案和最佳实践。', '建立行业认知、掌握方案设计、提供行业咨询', '5年以上行业经验、完成对应技术认证', '8周', 5, '技术工程师认证', 400, true, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_enrollments (id, program_name, user_name, company, status, progress, score, last_activity) VALUES
  ('e0000001-0000-0000-0000-000000000001', '基础销售认证', '张伟', '北京华泰信息技术有限公司', 'completed', 100, 85, NOW() - INTERVAL '2 days'),
  ('e0000001-0000-0000-0000-000000000002', '技术工程师认证', '张伟', '北京华泰信息技术有限公司', 'assessed', 80, 72, NOW() - INTERVAL '5 days'),
  ('e0000001-0000-0000-0000-000000000003', '高级销售认证', '李娜', '上海云智科技有限公司', 'completed', 100, 88, NOW() - INTERVAL '1 day'),
  ('e0000001-0000-0000-0000-000000000004', '基础销售认证', '李娜', '上海云智科技有限公司', 'completed', 100, 92, NOW() - INTERVAL '7 days'),
  ('e0000001-0000-0000-0000-000000000005', '技术工程师认证', '李娜', '上海云智科技有限公司', 'in_progress', 65, 0, NOW() - INTERVAL '3 days'),
  ('e0000001-0000-0000-0000-000000000006', '技术工程师认证', '王强', '深圳创新智联科技', 'completed', 100, 78, NOW() - INTERVAL '4 days'),
  ('e0000001-0000-0000-0000-000000000007', '高级技术专家认证', '王强', '深圳创新智联科技', 'in_progress', 45, 0, NOW() - INTERVAL '6 days'),
  ('e0000001-0000-0000-0000-000000000008', '合作伙伴管理认证', '刘洋', '杭州数字云科技', 'completed', 100, 82, NOW() - INTERVAL '2 days'),
  ('e0000001-0000-0000-0000-000000000009', '基础销售认证', '刘洋', '杭州数字云科技', 'completed', 100, 90, NOW() - INTERVAL '10 days'),
  ('e0000001-0000-0000-0000-000000000010', '高级销售认证', '刘洋', '杭州数字云科技', 'assessed', 85, 87, NOW() - INTERVAL '4 hours'),
  ('e0000001-0000-0000-0000-000000000011', '产品经理基础认证', '陈静', '广州智远数据服务', 'in_progress', 50, 0, NOW() - INTERVAL '1 day'),
  ('e0000001-0000-0000-0000-000000000012', '合作伙伴管理认证', '陈静', '广州智远数据服务', 'enrolled', 20, 0, NOW() - INTERVAL '12 hours'),
  ('e0000001-0000-0000-0000-000000000013', '基础销售认证', '赵磊', '北京华泰信息技术有限公司', 'completed', 100, 95, NOW() - INTERVAL '1 day'),
  ('e0000001-0000-0000-0000-000000000014', '技术工程师认证', '赵磊', '北京华泰信息技术有限公司', 'completed', 100, 88, NOW() - INTERVAL '3 hours'),
  ('e0000001-0000-0000-0000-000000000015', '高级技术专家认证', '赵磊', '北京华泰信息技术有限公司', 'in_progress', 70, 0, NOW() - INTERVAL '1 hour'),
  ('e0000001-0000-0000-0000-000000000016', '基础销售认证', '孙丽', '上海云智科技有限公司', 'completed', 100, 80, NOW() - INTERVAL '5 days'),
  ('e0000001-0000-0000-0000-000000000017', '技术工程师认证', '孙丽', '上海云智科技有限公司', 'assessed', 90, 75, NOW() - INTERVAL '2 days'),
  ('e0000001-0000-0000-0000-000000000018', '行业解决方案专家', '周涛', '深圳创新智联科技', 'enrolled', 15, 0, NOW() - INTERVAL '20 days'),
  ('e0000001-0000-0000-0000-000000000019', '产品经理基础认证', '吴刚', '广州智远数据服务', 'in_progress', 60, 0, NOW() - INTERVAL '8 hours'),
  ('e0000001-0000-0000-0000-000000000020', '合作伙伴管理认证', '郑敏', '杭州数字云科技', 'in_progress', 35, 0, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_records (id, user_name, program_name, company, type, score, level) VALUES
  ('a0000001-0000-0000-0000-000000000001', '张伟', '基础销售认证', '北京华泰信息技术有限公司', 'pre', 65, '初级'),
  ('a0000001-0000-0000-0000-000000000002', '张伟', '基础销售认证', '北京华泰信息技术有限公司', 'post', 85, '中级'),
  ('a0000001-0000-0000-0000-000000000003', '张伟', '技术工程师认证', '北京华泰信息技术有限公司', 'pre', 58, '初级'),
  ('a0000001-0000-0000-0000-000000000004', '张伟', '技术工程师认证', '北京华泰信息技术有限公司', 'post', 72, '中级'),
  ('a0000001-0000-0000-0000-000000000005', '李娜', '高级销售认证', '上海云智科技有限公司', 'pre', 70, '中级'),
  ('a0000001-0000-0000-0000-000000000006', '李娜', '高级销售认证', '上海云智科技有限公司', 'post', 88, '中级'),
  ('a0000001-0000-0000-0000-000000000007', '李娜', '基础销售认证', '上海云智科技有限公司', 'pre', 75, '初级'),
  ('a0000001-0000-0000-0000-000000000008', '李娜', '基础销售认证', '上海云智科技有限公司', 'post', 92, '高级'),
  ('a0000001-0000-0000-0000-000000000009', '王强', '技术工程师认证', '深圳创新智联科技', 'pre', 62, '初级'),
  ('a0000001-0000-0000-0000-000000000010', '王强', '技术工程师认证', '深圳创新智联科技', 'post', 78, '中级'),
  ('a0000001-0000-0000-0000-000000000011', '刘洋', '合作伙伴管理认证', '杭州数字云科技', 'pre', 68, '初级'),
  ('a0000001-0000-0000-0000-000000000012', '刘洋', '合作伙伴管理认证', '杭州数字云科技', 'post', 82, '中级'),
  ('a0000001-0000-0000-0000-000000000013', '刘洋', '高级销售认证', '杭州数字云科技', 'post', 87, '中级'),
  ('a0000001-0000-0000-0000-000000000014', '赵磊', '基础销售认证', '北京华泰信息技术有限公司', 'post', 95, '专家级'),
  ('a0000001-0000-0000-0000-000000000015', '赵磊', '技术工程师认证', '北京华泰信息技术有限公司', 'post', 88, '高级')
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_feedback (id, user_name, company, program_name, rating, content, tags) VALUES
  ('f0000001-0000-0000-0000-000000000001', '张伟', '北京华泰信息技术有限公司', '基础销售认证', 5.0, '课程内容非常丰富，案例很实用，讲师讲解清晰。', ARRAY['内容丰富', '案例实用', '讲解清晰']),
  ('f0000001-0000-0000-0000-000000000002', '李娜', '上海云智科技有限公司', '高级销售认证', 4.5, '高级课程有深度，但部分内容可以更贴近实际场景。', ARRAY['有深度', '贴近实战']),
  ('f0000001-0000-0000-0000-000000000003', '李娜', '上海云智科技有限公司', '基础销售认证', 5.0, '作为入门课程非常友好，循序渐进。', ARRAY['入门友好', '循序渐进']),
  ('f0000001-0000-0000-0000-000000000004', '王强', '深圳创新智联科技', '技术工程师认证', 4.0, '技术内容扎实，但有些章节节奏偏快。', ARRAY['技术扎实', '节奏偏快']),
  ('f0000001-0000-0000-0000-000000000005', '刘洋', '杭州数字云科技', '合作伙伴管理认证', 4.8, '课程非常实用，学到了很多合作伙伴管理的方法论。', ARRAY['实用', '方法论强']),
  ('f0000001-0000-0000-0000-000000000006', '刘洋', '杭州数字云科技', '高级销售认证', 4.5, '考核题目设计合理，能够检验真实能力。', ARRAY['考核合理']),
  ('f0000001-0000-0000-0000-000000000007', '赵磊', '北京华泰信息技术有限公司', '基础销售认证', 5.0, '最满意的课程，推荐给所有新入职同事！', ARRAY['推荐', '非常满意']),
  ('f0000001-0000-0000-0000-000000000008', '赵磊', '北京华泰信息技术有限公司', '技术工程师认证', 4.7, '技术课程设计很专业，实验环节收获很大。', ARRAY['专业', '实验丰富']),
  ('f0000001-0000-0000-0000-000000000009', '孙丽', '上海云智科技有限公司', '基础销售认证', 4.0, '整体不错，希望能有更多行业案例。', ARRAY['整体不错', '希望更多案例']),
  ('f0000001-0000-0000-0000-000000000010', '孙丽', '上海云智科技有限公司', '技术工程师认证', 3.5, '有些技术点需要一定的基础，建议前置课程补充。', ARRAY['需要基础', '建议完善前置']),
  ('f0000001-0000-0000-0000-000000000011', '陈静', '广州智远数据服务', '产品经理基础认证', 4.2, '产品思维的训练很有帮助，希望能有更多实战项目。', ARRAY['思维训练', '希望更多项目'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 执行完成提示
-- =====================================================================
SELECT 'SUCCESS: All 18 missing tables have been created and seeded with sample data.' AS status;
SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'campaign_%' OR table_name IN ('notifications', 'certification_programs', 'user_enrollments', 'assessment_records', 'course_feedback', 'annual_marketing_budgets', 'quarterly_budgets', 'category_budgets');
