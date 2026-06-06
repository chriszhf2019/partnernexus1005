import { supabase } from './supabase';

export const initializeExecutionTables = async () => {
  try {
    // 创建阶段日志表
    const createLogsTable = `
      CREATE TABLE IF NOT EXISTS marketing_phase_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id UUID NOT NULL REFERENCES marketing_activities(id) ON DELETE CASCADE,
        phase_id UUID REFERENCES marketing_execution_phases(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        description TEXT,
        operator TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    // 创建附件表
    const createAttachmentsTable = `
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
    `;

    // 添加索引
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_activity ON marketing_phase_logs(activity_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_phase ON marketing_phase_logs(phase_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_phase_logs_created ON marketing_phase_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_phase ON marketing_phase_attachments(phase_id);
      CREATE INDEX IF NOT EXISTS idx_marketing_phase_attachments_activity ON marketing_phase_attachments(activity_id);
    `;

    // 检查表是否存在并创建
    const { error: logsError } = await supabase.rpc('exec_sql', { sql: createLogsTable }).catch(() => ({ error: null }));
    const { error: attachmentsError } = await supabase.rpc('exec_sql', { sql: createAttachmentsTable }).catch(() => ({ error: null }));
    
    console.log('执行阶段扩展表初始化完成');
  } catch (error) {
    console.error('初始化执行阶段表失败:', error);
  }
};
