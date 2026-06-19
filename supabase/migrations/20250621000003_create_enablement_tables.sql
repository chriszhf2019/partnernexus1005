-- Migration: Create missing tables for notifications, certification programs and enablement
-- 执行方式: 在 Supabase Dashboard SQL Editor 中执行

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. notifications - 系统通知表
-- ═══════════════════════════════════════════════════════════════════════════
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
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. certification_programs - 认证课程/培训项目
-- ═══════════════════════════════════════════════════════════════════════════
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
CREATE POLICY "Allow all operations on certification_programs" ON certification_programs FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. user_enrollments - 用户报名/学习记录
-- ═══════════════════════════════════════════════════════════════════════════
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
CREATE POLICY "Allow all operations on user_enrollments" ON user_enrollments FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. assessment_records - 考核/测评记录
-- ═══════════════════════════════════════════════════════════════════════════
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
CREATE POLICY "Allow all operations on assessment_records" ON assessment_records FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. course_feedback - 课程反馈评价
-- ═══════════════════════════════════════════════════════════════════════════
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
CREATE POLICY "Allow all operations on course_feedback" ON course_feedback FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 种子数据 - 认证课程
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO certification_programs (id, name, category, level, description, objectives, target_audience, duration, assessment_count, prerequisites, points, is_active, usage_count) VALUES
  ('c0000001-0000-0000-0000-000000000001', '基础销售认证', 'Sales', 'Foundation', '掌握产品基础知识和销售方法论，能够独立完成产品演示和初步商机跟进。', '建立产品认知、掌握销售话术、熟悉商机管理流程', '新入职销售、初级合作伙伴销售人员', '2周', 2, '无', 100, true, 45),
  ('c0000001-0000-0000-0000-000000000002', '高级销售认证', 'Sales', 'Advanced', '深入掌握解决方案销售、客户痛点挖掘和大客户谈判技能，能够独立负责中型项目。', '掌握方案销售、提升谈判能力、建立客户管理体系', '1年以上销售经验、完成基础认证', '4周', 3, '基础销售认证', 200, true, 28),
  ('c0000001-0000-0000-0000-000000000003', '技术工程师认证', 'Technical', 'Professional', '掌握产品架构和技术原理，能够独立完成POC测试和技术方案设计。', '掌握产品架构、具备POC能力、能够编写技术方案', '售前工程师、技术支持、实施顾问', '3周', 3, '具备基础IT技能', 150, true, 32),
  ('c0000001-0000-0000-0000-000000000004', '高级技术专家认证', 'Technical', 'Expert', '深入理解产品底层原理，能够针对行业场景提供定制化技术方案，支持复杂客户需求。', '掌握高级架构、具备性能调优能力、能够处理复杂问题', '3年以上技术经验、完成技术工程师认证', '6周', 4, '技术工程师认证', 300, true, 15),
  ('c0000001-0000-0000-0000-000000000005', '合作伙伴管理认证', 'Management', 'Professional', '掌握合作伙伴招募、管理、激励和运营方法论，能够独立负责区域合作伙伴生态。', '掌握渠道管理、建立合作伙伴关系、提升运营能力', '渠道经理、合作伙伴运营人员', '3周', 2, '无', 180, true, 22),
  ('c0000001-0000-0000-0000-000000000006', '产品经理基础认证', 'Product', 'Foundation', '理解产品设计理念，能够参与产品规划和需求分析，有效支撑产品迭代。', '建立产品思维、学习需求分析、掌握产品工具', '产品人员、市场人员、合作伙伴产品对接人', '2周', 2, '无', 120, true, 18),
  ('c0000001-0000-0000-0000-000000000007', '行业解决方案专家', 'Industry', 'Expert', '深入理解特定行业业务场景，能够结合产品提供行业解决方案和最佳实践。', '建立行业认知、掌握方案设计、提供行业咨询', '5年以上行业经验、完成对应技术认证', '8周', 5, '技术工程师认证', 400, true, 8)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 种子数据 - 用户报名
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 种子数据 - 考核记录
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 种子数据 - 课程反馈
-- ═══════════════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 种子数据 - 系统通知
-- ═══════════════════════════════════════════════════════════════════════════
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

SELECT 'Missing tables created successfully!' as status;
