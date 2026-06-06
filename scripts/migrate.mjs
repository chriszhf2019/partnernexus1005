import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

async function runMigration() {
  console.log('开始数据库迁移...');

  const fs = await import('fs');
  const path = await import('path');
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250606000009_marketing_activity_management.sql');

  console.log('读取迁移文件:', migrationPath);

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // 使用 Supabase 的 SQL 执行端点
    const { data, error } = await supabase.rpc('exec', {
      query: sql
    });

    if (error) {
      console.error('迁移失败:', error);
      process.exit(1);
    }

    console.log('迁移执行成功!');
    console.log('响应:', data);
  } catch (err) {
    console.error('执行错误:', err);

    // 尝试使用 REST API 直接执行
    console.log('尝试使用 REST API...');

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
      });

      const result = await response.json();
      console.log('REST API 响应:', result);
    } catch (fetchErr) {
      console.error('REST API 错误:', fetchErr);
    }
  }
}

runMigration();
