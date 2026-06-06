-- 活动执行阶段扩展功能SQL脚本
-- 请在Supabase SQL Editor中执行此脚本

-- 1. 创建阶段日志表
CREATE TABLE IF NOT EXISTS marketing_phase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  operator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建附件表
CREATE TABLE IF NOT EXISTS marketing_phase_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'file',
  url TEXT,
  file_type TEXT,
  size INT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_activity ON marketing_phase_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_phase ON marketing_phase_logs(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_created ON marketing_phase_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_phase ON marketing_phase_attachments(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_activity ON marketing_phase_attachments(activity_id);

-- 4. 添加阶段备注字段（如果不存在）
ALTER TABLE marketing_execution_phases ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. 添加负责人字段（如果不存在）
ALTER TABLE marketing_execution_phases ADD COLUMN IF NOT EXISTS responsible_person TEXT;

-- 6. 授予权限（如果需要）
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
