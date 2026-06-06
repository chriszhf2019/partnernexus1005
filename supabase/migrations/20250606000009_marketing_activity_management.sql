-- 营销活动管理系统完整表结构
-- 包含：活动物料、客户名单、执行阶段、评估结果

-- 1. 活动物料表
CREATE TABLE IF NOT EXISTS marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'other', -- 'banner', 'brochure', 'gift', 'equipment', 'other'
  quantity INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'delivered'
  responsible_person TEXT,
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_materials_activity ON marketing_materials(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_materials_status ON marketing_materials(status);

-- 2. 活动客户名单表
CREATE TABLE IF NOT EXISTS marketing_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'invited', -- 'invited', 'confirmed', 'attended', 'absent', 'cancelled'
  partner_id UUID REFERENCES partners(id),
  partner_name TEXT,
  assigned_to TEXT, -- 负责人
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_guests_activity ON marketing_guests(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_guests_status ON marketing_guests(status);
CREATE INDEX IF NOT EXISTS idx_marketing_guests_partner ON marketing_guests(partner_id);

-- 3. 活动执行阶段表
CREATE TABLE IF NOT EXISTS marketing_execution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase_order INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
  start_date DATE,
  end_date DATE,
  responsible_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_phases_activity ON marketing_execution_phases(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phases_status ON marketing_execution_phases(status);
CREATE INDEX IF NOT EXISTS idx_marketing_phases_order ON marketing_execution_phases(phase_order);

-- 4. 执行阶段任务表
CREATE TABLE IF NOT EXISTS marketing_phase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'blocked'
  task_type TEXT DEFAULT 'manual', -- 'manual', 'mini_program_sync', 'notification', 'reminder'
  assigned_to TEXT,
  deadline DATE,
  completed_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_tasks_phase ON marketing_phase_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_activity ON marketing_phase_tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_status ON marketing_phase_tasks(status);

-- 5. 活动评估表
CREATE TABLE IF NOT EXISTS marketing_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  total_attendees INT DEFAULT 0,
  new_leads INT DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_lead DECIMAL(12,2) DEFAULT 0,
  satisfaction_score INT DEFAULT 0, -- 1-5
  feedback_summary TEXT,
  lessons_learned TEXT,
  recommendations TEXT,
  is_completed BOOLEAN DEFAULT false,
  evaluated_by TEXT,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_evaluations_activity ON marketing_evaluations(activity_id);

-- 6. 评估商机表
CREATE TABLE IF NOT EXISTS marketing_evaluation_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES marketing_evaluations(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES marketing_guests(id),
  name TEXT,
  company TEXT,
  title TEXT,
  phone TEXT,
  email TEXT,
  quality TEXT DEFAULT 'medium', -- 'hot', 'warm', 'medium', 'cold'
  notes TEXT,
  is_converted BOOLEAN DEFAULT false,
  converted_deal_id UUID, -- 转商机后关联的商机ID
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_eval_leads_evaluation ON marketing_evaluation_leads(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_marketing_eval_leads_activity ON marketing_evaluation_leads(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_eval_leads_converted ON marketing_evaluation_leads(is_converted);

-- 7. 向 marketing_activities 表添加缺少的字段
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS max_attendees INT DEFAULT 100;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS enable_checkin BOOLEAN DEFAULT false;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS enable_questions BOOLEAN DEFAULT false;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS enable_lottery BOOLEAN DEFAULT false;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS enable_share BOOLEAN DEFAULT false;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lottery_reward TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS signup_points INT DEFAULT 10;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS checkin_points INT DEFAULT 20;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS share_points INT DEFAULT 15;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS question_points INT DEFAULT 5;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS lottery_points INT DEFAULT 10;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS interaction_points INT DEFAULT 8;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS invite_points INT DEFAULT 25;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS review_points INT DEFAULT 12;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS complete_points INT DEFAULT 30;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS invitation_code TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS host_type TEXT DEFAULT 'vendor';
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS partner_id TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS partner_name TEXT;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS expected_attendees INT DEFAULT 0;

-- 创建默认阶段模板（可复制使用）
INSERT INTO marketing_execution_phases (activity_id, name, description, phase_order, status)
VALUES 
  ('00000000-0000-0000-0000-000000000000', '活动前准备', '活动策划、场地预订、物料准备', 1, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '宣传推广', '微信公众号推广、邮件邀请、社交媒体推广', 2, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '客户邀请', '发送邀请函、确认参加、收集信息', 3, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '活动执行', '签到、内容分享、互动环节', 4, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '活动收尾', '现场清理、数据整理、感谢邮件', 5, 'pending')
ON CONFLICT DO NOTHING;

-- 创建默认任务模板
INSERT INTO marketing_phase_tasks (phase_id, activity_id, name, description, task_type, status)
VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '准备活动物料', '准备海报、宣传册、礼品等', 'manual', 'pending'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '预订活动场地', '确认场地、布置方案', 'manual', 'pending'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '微信公众号发布', '发布活动预告文章', 'mini_program_sync', 'pending'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '发送邀请邮件', '批量发送邀请函', 'notification', 'pending'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '设置签到系统', '准备签到二维码、签到设备', 'manual', 'pending'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '数据同步到小程序', '将活动信息同步到小程序', 'mini_program_sync', 'pending')
ON CONFLICT DO NOTHING;
