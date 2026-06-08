/**
 * 数据库完整迁移执行脚本
 * 按顺序执行所有迁移文件
 * 用法: npx tsx scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeSQL(sql: string, label: string): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    const result = await response.json();
    if (response.ok) {
      console.log(`  ✓ ${label}`);
      return true;
    } else {
      if (result.message?.includes('already exists') || result.message?.includes('duplicate key')) {
        console.log(`  − ${label} (已存在，跳过)`);
        return true;
      }
      console.warn(`  ⚠ ${label}: ${result.message || '未知错误'}`);
      return false;
    }
  } catch (err: any) {
    console.warn(`  ⚠ ${label}: ${err.message}`);
    return false;
  }
}

async function runMigrations() {
  console.log('=== PartnerNexus 数据库完整迁移 ===\n');

  const migrationsDir = path.resolve('supabase/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`找到 ${files.length} 个迁移文件\n`);

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const label = file.replace(/^\d+_/, '').replace(/\.sql$/, '');

    console.log(`[${file}] ${label}`);

    // Split into individual statements
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 5 && !s.startsWith('--') && !s.startsWith('/*'));

    let success = 0;
    let failed = 0;

    for (const stmt of statements) {
      const firstLine = stmt.split('\n')[0].substring(0, 60);
      const ok = await executeSQL(stmt + ';', firstLine);
      if (ok) success++; else failed++;
    }

    console.log(`  结果: ${success} 成功, ${failed} 失败\n`);
  }

  console.log('=== 迁移执行完成 ===');
  console.log('如需手动验证，请访问:');
  console.log('  https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/sql');
}

runMigrations().catch(console.error);
