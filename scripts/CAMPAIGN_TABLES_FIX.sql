-- ═══════════════════════════════════════════════════════════════════════════
-- Partner Management System - 数据库修复脚本
-- 执行方式: 在 Supabase Dashboard SQL Editor 中一次性执行
-- 日期: 2025-06-21
-- 内容: 创建缺失的营销活动相关表并插入种子数据
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 第一部分: 创建缺失的数据库表
-- ═══════════════════════════════════════════════════════════════════════════

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

-- 13. campaign_deal_links - 活动与商机关联
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 第二部分: RLS 策略配置
-- ═══════════════════════════════════════════════════════════════════════════

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

-- 创建允许所有操作的策略
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 第三部分: 种子数据
-- ═══════════════════════════════════════════════════════════════════════════

-- 年度营销预算数据
INSERT INTO annual_marketing_budgets (id, year, total_budget, total_spent, remaining, status, created_by) VALUES
  ('a0000001-0000-0000-0000-000000000001', 2024, 5000000.00, 4200000.00, 800000.00, 'closed', 'admin'),
  ('a0000001-0000-0000-0000-000000000002', 2025, 6000000.00, 1800000.00, 4200000.00, 'active', 'admin')
ON CONFLICT (year) DO NOTHING;

-- 季度预算
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

-- 分类预算
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

-- 营销活动数据
INSERT INTO marketing_campaigns (id, name, type, host_type, year, quarter, category, region, city, budget, actual_spend, approved_amount, planned_start_date, planned_end_date, actual_start_date, actual_end_date, expected_attendees, actual_attendees, registered_count, checked_in_count, status, current_phase, responsible_person, description, leads_generated, deals_created, deals_value) VALUES
  ('mc000001-0000-0000-0000-000000000001', '2025年度合作伙伴峰会', 'partner_summit', 'vendor', 2025, 'Q1', '合作伙伴大会', '全国', '北京', 1500000.00, 1450000.00, 1500000.00, '2025-03-15', '2025-03-17', '2025-03-15', '2025-03-17', 500, 480, 520, 465, 'completed', 'evaluation', '渠道总监', '年度最重要的合作伙伴大会，汇聚全国核心渠道商', 120, 35, 8500000.00),
  ('mc000001-0000-0000-0000-000000000002', '云原生技术赋能培训', 'technical_training', 'vendor', 2025, 'Q1', '技术培训', '华东', '上海', 300000.00, 285000.00, 300000.00, '2025-01-20', '2025-01-22', '2025-01-20', '2025-01-22', 100, 92, 105, 88, 'completed', 'evaluation', '技术总监', '云原生技术深度培训，提升合作伙伴技术能力', 45, 12, 2400000.00),
  ('mc000001-0000-0000-0000-000000000003', 'Q2渠道拓展训练营', 'channel_training', 'vendor', 2025, 'Q2', '技术培训', '华南', '深圳', 250000.00, 80000.00, 250000.00, '2025-04-15', '2025-04-17', '2025-04-15', NULL, 80, 52, 68, 48, 'in_progress', 'execution', '区域经理', 'Q2渠道拓展专项训练，提升销售技能', 28, 5, 1200000.00),
  ('mc000001-0000-0000-0000-000000000004', '2025数字化营销研讨会', 'digital_marketing', 'vendor', 2025, 'Q2', '市场推广', '全国', '线上', 200000.00, 0, 200000.00, '2025-06-10', '2025-06-12', NULL, NULL, 200, 0, 0, 0, 'planning', 'planning', '市场经理', '探讨数字化营销最佳实践，助力合作伙伴市场能力提升', 0, 0, 0.00),
  ('mc000001-0000-0000-0000-000000000005', '智能制造解决方案Workshop', 'solution_workshop', 'vendor', 2025, 'Q1', '技术培训', '华北', '北京', 180000.00, 175000.00, 180000.00, '2025-02-25', '2025-02-27', '2025-02-25', '2025-02-27', 60, 55, 62, 52, 'completed', 'evaluation', '解决方案总监', '智能制造解决方案深度研讨', 32, 8, 1600000.00)
ON CONFLICT DO NOTHING;

-- 活动参会人员数据
INSERT INTO campaign_attendees (id, campaign_id, name, company, position, phone, email, source, attendee_type, registered_at, checked_in, total_points, status, interest_topics, follow_up_status, deal_created) VALUES
  ('ca000001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', '张伟', '北京华泰信息技术有限公司', '总经理', '13800138001', 'zhangwei@huataitech.com', 'registration', 'partner', '2025-02-20 10:00:00', true, 150, 'attended', ARRAY['云原生', '智能制造', '渠道政策'], 'completed', true),
  ('ca000001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000001', '李娜', '上海云智科技有限公司', '销售总监', '13800138002', 'lina@yunzhitech.com', 'invitation', 'partner', '2025-02-18 14:30:00', true, 120, 'attended', ARRAY['云原生', '数字化转型'], 'in_progress', true),
  ('ca000001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000001', '王强', '深圳创新智联科技', '技术经理', '13800138003', 'wangqiang@cxzltech.com', 'registration', 'prospect', '2025-02-22 09:15:00', true, 100, 'attended', ARRAY['技术架构', '智能制造'], 'pending', false),
  ('ca000001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000001', '陈静', '广州智远数据服务', '市场总监', '13800138004', 'chenjing@zhiyuandata.com', 'invitation', 'partner', '2025-02-19 16:45:00', false, 30, 'registered', ARRAY['市场推广', '数字化营销'], 'pending', false),
  ('ca000001-0000-0000-0000-000000000005', 'mc000001-0000-0000-0000-000000000001', '刘洋', '杭州数字云科技', '总经理', '13800138005', 'liuyang@szcloudtech.com', 'registration', 'partner', '2025-02-21 11:20:00', true, 130, 'attended', ARRAY['云原生', '渠道政策', '市场推广'], 'completed', true),
  ('ca000001-0000-0000-0000-000000000006', 'mc000001-0000-0000-0000-000000000002', '赵磊', '北京华泰信息技术有限公司', '架构师', '13900139001', 'zhaolei@huataitech.com', 'registration', 'partner', '2025-01-05 10:00:00', true, 200, 'attended', ARRAY['云原生', 'K8s', '微服务'], 'completed', true),
  ('ca000001-0000-0000-0000-000000000007', 'mc000001-0000-0000-0000-000000000002', '孙丽', '上海云智科技有限公司', '技术负责人', '13900139002', 'sunli@yunzhitech.com', 'registration', 'partner', '2025-01-06 14:00:00', true, 180, 'attended', ARRAY['云原生', 'DevOps', '容器化'], 'completed', true),
  ('ca000001-0000-0000-0000-000000000008', 'mc000001-0000-0000-0000-000000000002', '周涛', '深圳创新智联科技', '开发工程师', '13900139003', 'zhoutao@cxzltech.com', 'invitation', 'prospect', '2025-01-08 09:30:00', true, 160, 'attended', ARRAY['K8s', '微服务'], 'in_progress', false),
  ('ca000001-0000-0000-0000-000000000009', 'mc000001-0000-0000-0000-000000000003', '吴刚', '广州智远数据服务', '区域经理', '13700137001', 'wugang@zhiyuandata.com', 'registration', 'partner', '2025-03-20 10:00:00', true, 80, 'attended', ARRAY['销售渠道', '客户开发'], 'in_progress', false),
  ('ca000001-0000-0000-0000-000000000010', 'mc000001-0000-0000-0000-000000000003', '郑敏', '杭州数字云科技', '销售主管', '13700137002', 'zhengmin@szcloudtech.com', 'invitation', 'partner', '2025-03-22 14:30:00', true, 70, 'attended', ARRAY['销售技巧', '商机管理'], 'pending', false)
ON CONFLICT DO NOTHING;

-- 活动积分记录数据
INSERT INTO campaign_point_records (id, campaign_id, attendee_id, attendee_name, source, points, description) VALUES
  ('cpr00001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', 'registration', 50, '活动报名'),
  ('cpr00001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', 'check_in', 30, '现场签到'),
  ('cpr00001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', 'question', 10, '提问奖励'),
  ('cpr00001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', 'sharing', 20, '分享奖励'),
  ('cpr00001-0000-0000-0000-000000000005', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', 'feedback', 40, '填写反馈'),
  ('cpr00001-0000-0000-0000-000000000006', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', '李娜', 'registration', 50, '活动报名'),
  ('cpr00001-0000-0000-0000-000000000007', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', '李娜', 'check_in', 30, '现场签到'),
  ('cpr00001-0000-0000-0000-000000000008', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', '李娜', 'question', 20, '提问奖励'),
  ('cpr00001-0000-0000-0000-000000000009', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', '李娜', 'sharing', 20, '分享奖励'),
  ('cpr00001-0000-0000-0000-000000000010', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000006', '赵磊', 'registration', 50, '活动报名'),
  ('cpr00001-0000-0000-0000-000000000011', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000006', '赵磊', 'check_in', 30, '现场签到'),
  ('cpr00001-0000-0000-0000-000000000012', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000006', '赵磊', 'workshop', 60, '工作坊参与'),
  ('cpr00001-0000-0000-0000-000000000013', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000006', '赵磊', 'exam', 60, '考核通过')
ON CONFLICT DO NOTHING;

-- 活动邀请数据
INSERT INTO campaign_invitations (id, campaign_id, invitee_name, invitee_company, invitee_email, invitee_phone, invitation_code, invited_at, registered) VALUES
  ('ci000001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', '张伟', '北京华泰信息技术有限公司', 'zhangwei@huataitech.com', '13800138001', 'INV20250315A001', '2025-02-10 09:00:00', true),
  ('ci000001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000001', '李娜', '上海云智科技有限公司', 'lina@yunzhitech.com', '13800138002', 'INV20250315A002', '2025-02-12 14:00:00', true),
  ('ci000001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000001', '王强', '深圳创新智联科技', 'wangqiang@cxzltech.com', '13800138003', 'INV20250315A003', '2025-02-15 10:30:00', true),
  ('ci000001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000001', '陈静', '广州智远数据服务', 'chenjing@zhiyuandata.com', '13800138004', 'INV20250315A004', '2025-02-18 16:00:00', false),
  ('ci000001-0000-0000-0000-000000000005', 'mc000001-0000-0000-0000-000000000002', '赵磊', '北京华泰信息技术有限公司', 'zhaolei@huataitech.com', '13900139001', 'INV20250120B001', '2025-01-02 09:00:00', true),
  ('ci000001-0000-0000-0000-000000000006', 'mc000001-0000-0000-0000-000000000002', '孙丽', '上海云智科技有限公司', 'sunli@yunzhitech.com', '13900139002', 'INV20250120B002', '2025-01-03 14:00:00', true)
ON CONFLICT (invitation_code) DO NOTHING;

-- 活动评估数据
INSERT INTO campaign_evaluations (id, campaign_id, overall_quality, dimensions, conversion_rate, lead_conversion_rate, deal_conversion_rate, attendee_satisfaction, roi, strengths, improvements, evaluator, evaluated_at) VALUES
  ('ce000001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', 4.5, '["内容深度", "讲师水平", "互动环节", "场地设施"]', 24.0, 85.7, 29.2, 4.6, 5.7, '内容丰富，干货满满；讲师专业，案例分享到位；互动环节设计合理。', '可增加更多实战演练环节，建议延长培训时间。', '市场经理', '2025-03-20 10:00:00'),
  ('ce000001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000002', 4.8, '["技术深度", "实操比例", "案例分析", "学习氛围"]', 45.0, 100.0, 26.7, 4.9, 8.0, '云原生技术讲解深入浅出，实操环节占比高，学员反馈积极。', '可考虑增加更多企业级场景案例。', '技术总监', '2025-01-25 14:00:00'),
  ('ce000001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000005', 4.6, '["方案完整性", "案例丰富度", "互动性", "实用性"]', 53.3, 100.0, 25.0, 4.7, 8.9, '智能制造解决方案覆盖全面，案例丰富，实用性很强。', '可增加更多跨行业应用场景。', '解决方案总监', '2025-02-28 16:00:00')
ON CONFLICT (campaign_id) DO NOTHING;

-- 小程序配置数据
INSERT INTO campaign_mini_app_configs (id, campaign_id, enabled, allow_registration, allow_check_in, allow_questions, allow_lottery, allow_sharing, allow_feedback, signup_points, check_in_points, question_points, lottery_points, sharing_points, feedback_points, max_attendees, registration_deadline) VALUES
  ('cma00001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', true, true, true, true, true, true, true, 50, 30, 10, 100, 20, 40, 500, '2025-03-10 23:59:59'),
  ('cma00001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000002', true, true, true, true, false, true, true, 30, 20, 5, 0, 10, 20, 100, '2025-01-15 23:59:59'),
  ('cma00001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000003', true, true, true, true, true, true, true, 20, 15, 5, 50, 10, 15, 80, '2025-04-10 23:59:59'),
  ('cma00001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000004', true, true, false, true, false, true, true, 10, 0, 5, 0, 5, 10, 200, '2025-06-05 23:59:59')
ON CONFLICT (campaign_id) DO NOTHING;

-- 活动反馈数据
INSERT INTO campaign_feedback (id, campaign_id, attendee_id, attendee_name, attendee_company, rating, content, submitted_at, is_anonymity) VALUES
  ('cf000001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', '北京华泰信息技术有限公司', 5.0, '非常满意！活动组织有序，内容丰富实用，结识了很多行业伙伴，期待明年继续参加。', '2025-03-17 18:00:00', false),
  ('cf000001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000002', '李娜', '上海云智科技有限公司', 4.5, '整体很不错，讲师很专业，希望能有更多实战演练环节。', '2025-03-17 17:30:00', false),
  ('cf000001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000001', NULL, NULL, NULL, 4.0, '活动整体满意，但签到环节可以优化，排队时间稍长。', '2025-03-17 17:00:00', true),
  ('cf000001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000006', '赵磊', '北京华泰信息技术有限公司', 5.0, '技术培训非常专业，干货满满！K8s和微服务的讲解深入浅出，对工作帮助很大。', '2025-01-22 16:00:00', false),
  ('cf000001-0000-0000-0000-000000000005', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000007', '孙丽', '上海云智科技有限公司', 4.8, '课程内容充实，老师经验丰富，DevOps实践部分特别实用。', '2025-01-22 15:30:00', false)
ON CONFLICT DO NOTHING;

-- 活动提问数据
INSERT INTO campaign_questions (id, campaign_id, attendee_id, attendee_name, content, is_answered, answer, answered_by, answered_at, upvotes) VALUES
  ('cq000001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', '张伟', '关于渠道合作伙伴分级政策，今年是否有新的调整计划？', true, '感谢提问！今年Q2将推出新的合作伙伴分级政策，主要变化是增加钻石级合作伙伴的权益，同时优化金级和银级的评定标准。详细政策将在4月份正式发布。', '渠道总监', '2025-03-16 10:30:00', 15),
  ('cq000001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000002', '李娜', 'MDF配额申请流程能否进一步简化？', true, '已收到建议！MDF配额申请流程将从Q2开始优化，计划减少30%的材料提交要求，同时上线线上审批系统，审批周期从15天缩短至7天。', '渠道经理', '2025-03-16 11:00:00', 12),
  ('cq000001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000005', '刘洋', '今年的市场支持预算比例是否有提升？', true, '是的！今年市场支持预算整体提升20%，其中数字化营销预算提升最为明显，达到35%。同时我们还推出了新的联合市场活动计划，欢迎各位伙伴积极参与。', '市场总监', '2025-03-16 11:30:00', 10),
  ('cq000001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000006', '赵磊', '企业级K8s集群的安全最佳实践有哪些？', true, '企业级K8s安全最佳实践主要包括：1) RBAC权限控制 2) Network Policy网络隔离 3) Pod Security Standards 4) 密钥管理（使用Vault） 5) 审计日志。建议参考CNCF安全白皮书。', '技术专家', '2025-01-21 14:00:00', 20),
  ('cq000001-0000-0000-0000-000000000005', 'mc000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000007', '孙丽', '微服务治理方面有哪些成熟的落地方案？', true, '微服务治理推荐采用Service Mesh方案，如Istio或Linkerd。具体落地方案包括：服务发现、负载均衡、熔断限流、链路追踪、统一认证等模块。我们有成熟的客户案例可以参考。', '架构师', '2025-01-21 15:00:00', 18)
ON CONFLICT DO NOTHING;

-- 活动阶段任务数据
INSERT INTO campaign_phase_tasks (id, campaign_id, phase, title, description, due_date, assignee, status, completed_at, task_order) VALUES
  ('cpt00001-0000-0000-0000-000000000001', 'mc000001-0000-0000-0000-000000000001', 'planning', '确定活动场地', '选择合作伙伴峰会场地，需容纳500人', '2025-02-01', '市场经理', 'completed', '2025-01-28', 1),
  ('cpt00001-0000-0000-0000-000000000002', 'mc000001-0000-0000-0000-000000000001', 'planning', '邀请嘉宾确认', '确认演讲嘉宾和分享主题', '2025-02-15', '市场经理', 'completed', '2025-02-12', 2),
  ('cpt00001-0000-0000-0000-000000000003', 'mc000001-0000-0000-0000-000000000001', 'planning', '活动物料准备', '制作宣传物料、签到系统、抽奖系统', '2025-03-01', '市场专员', 'completed', '2025-02-28', 3),
  ('cpt00001-0000-0000-0000-000000000004', 'mc000001-0000-0000-0000-000000000001', 'execution', '现场签到', '活动当天现场签到和引导', '2025-03-15', '运营团队', 'completed', '2025-03-15 08:00:00', 1),
  ('cpt00001-0000-0000-0000-000000000005', 'mc000001-0000-0000-0000-000000000001', 'execution', '活动直播', '确保活动直播顺畅进行', '2025-03-15', '技术团队', 'completed', '2025-03-15 09:00:00', 2),
  ('cpt00001-0000-0000-0000-000000000006', 'mc000001-0000-0000-0000-000000000001', 'evaluation', '活动总结报告', '编写活动总结和效果分析报告', '2025-03-25', '市场经理', 'completed', '2025-03-22', 1),
  ('cpt00001-0000-0000-0000-000000000007', 'mc000001-0000-0000-0000-000000000003', 'planning', '课程内容设计', '设计Q2渠道拓展训练营课程', '2025-03-30', '培训经理', 'completed', '2025-03-25', 1),
  ('cpt00001-0000-0000-0000-000000000008', 'mc000001-0000-0000-0000-000000000003', 'planning', '讲师邀请', '邀请内外部培训讲师', '2025-04-05', '培训经理', 'completed', '2025-04-02', 2),
  ('cpt00001-0000-0000-0000-000000000009', 'mc000001-0000-0000-0000-000000000003', 'planning', '学员招募', '通过各区域经理招募目标学员', '2025-04-10', '区域经理', 'completed', '2025-04-08', 3),
  ('cpt00001-0000-0000-0000-000000000010', 'mc000001-0000-0000-0000-000000000003', 'execution', '现场培训', '开展Q2渠道拓展训练营', '2025-04-15', '培训团队', 'in_progress', NULL, 1),
  ('cpt00001-0000-0000-0000-000000000011', 'mc000001-0000-0000-0000-000000000004', 'planning', '研讨会主题确认', '确定数字化营销研讨会的主题和议程', '2025-05-15', '市场经理', 'pending', NULL, 1),
  ('cpt00001-0000-0000-0000-000000000012', 'mc000001-0000-0000-0000-000000000004', 'planning', '讲师资源对接', '对接数字化营销领域的专家讲师', '2025-05-30', '市场经理', 'pending', NULL, 2)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 验证查询
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'campaign_%' ORDER BY table_name;
