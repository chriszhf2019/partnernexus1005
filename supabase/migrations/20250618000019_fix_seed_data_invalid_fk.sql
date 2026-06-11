-- Fix: Migration 009 seed data used all-zero UUID that violates FK constraints.
-- This migration inserts a proper template activity so the phase/task templates
-- can reference a valid activity_id. The all-zero UUID used in 009's INSERTs
-- caused FK violations — those INSERTs silently failed. This migration provides
-- the template records that were meant to exist.

-- Insert template activity (sentinel UUID matching what 009 attempted to use)
INSERT INTO marketing_activities (id, name, type, status, budget, actual_spend)
VALUES ('00000000-0000-0000-0000-000000000000', '[模板] 默认活动', 'template', 'draft', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Template execution phases (matching 009's seed data intent)
INSERT INTO marketing_execution_phases (activity_id, name, description, phase_order, status)
SELECT id, name, description, phase_order, status
FROM (VALUES
  ('00000000-0000-0000-0000-000000000000'::UUID, '活动前准备', '活动策划、场地预订、物料准备', 1, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '宣传推广', '微信公众号推广、邮件邀请、社交媒体推广', 2, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '客户邀请', '发送邀请函、确认参加、收集信息', 3, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '活动执行', '签到、内容分享、互动环节', 4, 'pending'),
  ('00000000-0000-0000-0000-000000000000', '活动收尾', '现场清理、数据整理、感谢邮件', 5, 'pending')
) AS t(activity_id, name, description, phase_order, status)
WHERE EXISTS (SELECT 1 FROM marketing_activities WHERE id = '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Template phase tasks (matching 009's seed data intent)
INSERT INTO marketing_phase_tasks (phase_id, activity_id, name, description, task_type, status)
SELECT mp.id, '00000000-0000-0000-0000-000000000000', t.name, t.description, t.task_type, t.status
FROM (VALUES
  ('活动前准备', '准备活动物料', '准备海报、宣传册、礼品等', 'manual', 'pending'),
  ('活动前准备', '预订活动场地', '确认场地、布置方案', 'manual', 'pending'),
  ('宣传推广', '微信公众号发布', '发布活动预告文章', 'mini_program_sync', 'pending'),
  ('客户邀请', '发送邀请邮件', '批量发送邀请函', 'notification', 'pending'),
  ('活动执行', '设置签到系统', '准备签到二维码、签到设备', 'manual', 'pending'),
  ('活动收尾', '数据同步到小程序', '将活动信息同步到小程序', 'mini_program_sync', 'pending')
) AS t(phase_name, name, description, task_type, status)
JOIN marketing_execution_phases mp ON mp.activity_id = '00000000-0000-0000-0000-000000000000' AND mp.name = t.phase_name
WHERE EXISTS (SELECT 1 FROM marketing_activities WHERE id = '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;
