-- 活动执行阶段日志表
CREATE TABLE IF NOT EXISTS marketing_phase_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  operator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_activity ON marketing_phase_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_phase ON marketing_phase_logs(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_created ON marketing_phase_logs(created_at DESC);

-- 阶段附件表
CREATE TABLE IF NOT EXISTS marketing_phase_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'file', -- 'file', 'link', 'image'
  url TEXT,
  file_type TEXT,
  size INT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_phase ON marketing_phase_attachments(phase_id);
CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_activity ON marketing_phase_attachments(activity_id);
