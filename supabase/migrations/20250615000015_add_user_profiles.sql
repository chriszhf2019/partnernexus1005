-- 用户档案表：支撑 LearnerTooltip 悬浮详情 + 公司维度数据
-- 在 Supabase SQL Editor 中执行: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/sql

BEGIN;

-- ═══════════════════════════════════════════
-- Step 1: 创建 user_profiles 表
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  hire_date TEXT,
  pass_rate INTEGER DEFAULT 0,
  manager TEXT,
  department TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- Step 2: 插入 7 位用户的真实档案
-- ═══════════════════════════════════════════
INSERT INTO public.user_profiles (user_name, company, hire_date, pass_rate, manager, department, region)
VALUES
  ('张伟', '神州数码集团股份有限公司', '2023-03', 85, '王经理', '销售部', '华北'),
  ('李明', '东软集团股份有限公司', '2022-07', 72, '赵总监', '技术部', '东北'),
  ('王芳', '中科软科技股份有限公司', '2023-11', 68, '陈经理', '市场部', '华东'),
  ('赵强', '神州数码集团股份有限公司', '2021-05', 90, '王经理', '技术部', '华北'),
  ('陈晓东', '浪潮集团有限公司', '2023-01', 75, '刘总监', '销售部', '华东'),
  ('刘娜', '中科软科技股份有限公司', '2024-02', 55, '陈经理', '市场部', '华东'),
  ('孙浩', '华为云计算技术有限公司', '2022-09', 92, '周总监', '技术部', '华南'),
  ('周丽', '华为云计算技术有限公司', '2021-12', 88, '周总监', '技术部', '华南'),
  ('刘磊', '浪潮集团有限公司', '2023-06', 62, '刘总监', '销售部', '华东')
ON CONFLICT (user_name) DO UPDATE SET
  company = EXCLUDED.company,
  hire_date = EXCLUDED.hire_date,
  pass_rate = EXCLUDED.pass_rate,
  manager = EXCLUDED.manager,
  department = EXCLUDED.department,
  region = EXCLUDED.region,
  updated_at = NOW();

-- ═══════════════════════════════════════════
-- Step 3: 更新反馈内容为多样化评价
-- ═══════════════════════════════════════════
UPDATE public.course_feedback SET content = '课程内容非常实用，客户沟通技巧部分直接用到工作中，效果立竿见影' WHERE id = '363080fd-7769-47cc-b4a7-cdfa6cf3b824';

UPDATE public.course_feedback SET content = '案例丰富，讲师水平高，但课程时长偏长，建议拆分章节便于碎片化学习' WHERE id = 'f1d97e4b-b6af-4901-a7ac-055f2177c798';

UPDATE public.course_feedback SET content = '整体不错，但录音不够清晰，部分章节需要反复听才能理解' WHERE id = 'd195bcaf-33c4-40a4-9f00-5ad24bcbc88f';

-- 补充更多反馈
INSERT INTO public.course_feedback (user_name, company, program_name, rating, content, helpful)
SELECT '赵强', '神州数码集团股份有限公司', '技术方案架构设计', 4, '架构设计思路清晰，实验环境搭建有点慢，建议提前准备好镜像', true
WHERE NOT EXISTS (SELECT 1 FROM public.course_feedback WHERE user_name = '赵强' AND program_name = '技术方案架构设计');

INSERT INTO public.course_feedback (user_name, company, program_name, rating, content, helpful)
SELECT '孙浩', '华为云计算技术有限公司', '云原生架构深度实践', 2, 'K8s 实战部分更新不及时，用的还是老版本，希望能更新到最新稳定版', true
WHERE NOT EXISTS (SELECT 1 FROM public.course_feedback WHERE user_name = '孙浩' AND program_name = '云原生架构深度实践');

INSERT INTO public.course_feedback (user_name, company, program_name, rating, content, helpful)
SELECT '王芳', '中科软科技股份有限公司', '市场活动策划与执行', 5, '从策划到执行的全流程讲解透彻，模板和工具包可以直接拿来用，太棒了！', true
WHERE NOT EXISTS (SELECT 1 FROM public.course_feedback WHERE user_name = '王芳' AND program_name = '市场活动策划与执行');

INSERT INTO public.course_feedback (user_name, company, program_name, rating, content, helpful)
SELECT '李明', '东软集团股份有限公司', '大客户商务谈判实战', 4, '谈判策略部分很受启发，希望能增加更多 B2B 场景的模拟练习', true
WHERE NOT EXISTS (SELECT 1 FROM public.course_feedback WHERE user_name = '李明' AND program_name = '大客户商务谈判实战');

INSERT INTO public.course_feedback (user_name, company, program_name, rating, content, helpful)
SELECT '刘娜', '中科软科技股份有限公司', '销售基础:客户沟通技巧', 3, '基础内容较多，对新人友好但对有经验的销售来说重复率高，建议分级教学', true
WHERE NOT EXISTS (SELECT 1 FROM public.course_feedback WHERE user_name = '刘娜' AND program_name = '销售基础:客户沟通技巧');

-- ═══════════════════════════════════════════
-- Step 4: 验证
-- ═══════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE 'user_profiles: %', (SELECT COUNT(*) FROM public.user_profiles);
  RAISE NOTICE 'course_feedback: %', (SELECT COUNT(*) FROM public.course_feedback);
END $$;

COMMIT;
