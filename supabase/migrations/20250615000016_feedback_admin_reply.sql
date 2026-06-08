-- 反馈表增加管理员回复字段 + AI标签 + 状态
-- 在 Supabase SQL Editor 中执行

ALTER TABLE public.course_feedback
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tags TEXT[];

COMMENT ON COLUMN public.course_feedback.admin_reply IS '管理员回复内容';
COMMENT ON COLUMN public.course_feedback.admin_reply_at IS '管理员回复时间';
COMMENT ON COLUMN public.course_feedback.status IS '处理状态: pending/processed';
COMMENT ON COLUMN public.course_feedback.tags IS 'AI 语义标签数组';
