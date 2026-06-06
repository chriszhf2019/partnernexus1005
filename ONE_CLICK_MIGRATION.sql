-- 营销活动管理数据库迁移 (20250606)

-- ========================================
-- 第1批：创建所有表
-- ========================================

CREATE TABLE IF NOT EXISTS marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'other',
  quantity INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  responsible_person TEXT,
  deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'invited',
  partner_id UUID REFERENCES partners(id),
  partner_name TEXT,
  assigned_to TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_execution_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase_order INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  responsible_person TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_phase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  task_type TEXT DEFAULT 'manual',
  assigned_to TEXT,
  deadline DATE,
  completed_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  total_attendees INT DEFAULT 0,
  new_leads INT DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_lead DECIMAL(12,2) DEFAULT 0,
  satisfaction_score INT DEFAULT 0,
  feedback_summary TEXT,
  lessons_learned TEXT,
  recommendations TEXT,
  is_completed BOOLEAN DEFAULT false,
  evaluated_by TEXT,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  quality TEXT DEFAULT 'medium',
  notes TEXT,
  is_converted BOOLEAN DEFAULT false,
  converted_deal_id UUID,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 第2批：扩展 marketing_activities 表
-- ========================================

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

-- ========================================
-- 第3批：创建索引
-- ========================================

CREATE INDEX IF NOT EXISTS idx_marketing_materials_activity ON marketing_materials(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_materials_status ON marketing_materials(status);
CREATE INDEX IF NOT EXISTS idx_marketing_guests_activity ON marketing_guests(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_guests_status ON marketing_guests(status);
CREATE INDEX IF NOT EXISTS idx_marketing_guests_partner ON marketing_guests(partner_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phases_activity ON marketing_execution_phases(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phases_status ON marketing_execution_phases(status);
CREATE INDEX IF NOT EXISTS idx_marketing_phases_order ON marketing_execution_phases(phase_order);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_phase ON marketing_phase_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_activity ON marketing_phase_tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_status ON marketing_phase_tasks(status);
CREATE INDEX IF NOT EXISTS idx_marketing_evaluations_activity ON marketing_evaluations(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_eval_leads_evaluation ON marketing_evaluation_leads(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_marketing_eval_leads_activity ON marketing_evaluation_leads(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_eval_leads_converted ON marketing_evaluation_leads(is_converted);

-- ✅ Migration Complete!
