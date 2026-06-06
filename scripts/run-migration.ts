/**
 * 数据库迁移执行脚本
 * 使用 Supabase REST API 执行 SQL
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeSQL(sql) {
  try {
    console.log('Executing SQL...');
    // 使用直接查询方式
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { 
      query: sql 
    });
    if (error) {
      throw error;
    }
    return data;
  } catch (err) {
    console.error('SQL执行失败:', err.message);
    return null;
  }
}

async function runMigration() {
  console.log('=== 开始执行激励政策优化数据库迁移 ===');
  
  const migrationFile = 'supabase/migrations/20250608000011_incentive_policy_optimization.sql';
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`错误：找不到迁移文件 ${migrationFile}`);
    process.exit(1);
  }
  
  console.log(`读取迁移文件: ${migrationFile}`);
  const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
  
  // 分割SQL语句（按分号分割，但保留多行注释）
  const statements = sqlContent
    .split(/;(?=\s*(?:--|\/\*|CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|GRANT|REVOKE))/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  console.log(`共解析出 ${statements.length} 条SQL语句`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] 执行语句:`);
    console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
    
    try {
      // 使用PostgREST直接执行
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: statement })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✓ 执行成功');
      } else {
        console.warn(`⚠ 执行警告: ${result.message || '未知错误'}`);
      }
    } catch (err) {
      console.warn(`⚠ 执行异常: ${err.message}`);
    }
  }
  
  console.log('\n=== 迁移执行完成 ===');
  console.log('\n注意：如果某些语句执行失败，请手动在Supabase Dashboard中执行');
  console.log('Supabase SQL编辑器: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/sql');
}

runMigration().catch(console.error);