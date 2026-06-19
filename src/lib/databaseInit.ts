import { supabase } from './supabase';

/**
 * 初始化营销活动执行阶段所需的数据表。
 *
 * ⚠️ `exec_sql` 是一个自定义 PostgreSQL RPC 函数，需要在 Supabase
 *    SQL Editor 中手工创建一次：
 *
 *    CREATE OR REPLACE FUNCTION exec_sql(sql text)
 *    RETURNS void
 *    LANGUAGE plpgsql
 *    SECURITY DEFINER
 *    AS $$
 *    BEGIN
 *      EXECUTE sql;
 *    END;
 *    $$;
 *
 * 如果该 RPC 不存在，函数会静默降级（表可能已存在）。
 */
export const initializeExecutionTables = async () => {
  const sqlStatements = [
    // 创建阶段日志表
    // 注意：marketing_plan 是主活动表
    `CREATE TABLE IF NOT EXISTS marketing_phase_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      activity_id UUID NOT NULL REFERENCES marketing_plan(id) ON DELETE CASCADE,
      phase_id UUID REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      description TEXT,
      operator TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    // 创建附件表
    `CREATE TABLE IF NOT EXISTS marketing_phase_attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phase_id UUID NOT NULL REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
      activity_id UUID NOT NULL REFERENCES marketing_plan(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'file',
      url TEXT,
      file_type TEXT,
      size INT,
      uploaded_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    // 添加索引
    `CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_activity ON marketing_phase_logs(activity_id);
    CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_phase ON marketing_phase_logs(phase_id);
    CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_created ON marketing_phase_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_phase ON marketing_phase_attachments(phase_id);
    CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_activity ON marketing_phase_attachments(activity_id);`,
  ];

  for (const sql of sqlStatements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        // RPC 不存在或无权执行 — 这是预期的，表可能已通过 SQL Editor 提前创建
        console.warn('[databaseInit] exec_sql RPC 调用失败，请确认已在 Supabase SQL Editor 中创建 exec_sql 函数。', error.message);
      }
    } catch (e: any) {
      // 静默降级：表可能已存在，或 RPC 尚未创建
      if (e?.message !== 'Failed to fetch') {
        console.warn('[databaseInit] 执行 SQL 时出现非网络错误:', e?.message);
      }
    }
  }

  console.log('执行阶段扩展表初始化完成（如有 RPC 错误请忽略，表可能已存在）');
};
