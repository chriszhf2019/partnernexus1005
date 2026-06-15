// ══════════════════════════════════════════════════════════════════════════
// Apply Supabase Migrations Script
// Usage: node scripts/apply-migrations.js
// Requires SUPABASE_SERVICE_KEY env var or updates .env with correct anon key
// ══════════════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  // Try to get Supabase URL from multiple sources
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  // Fallback: read from .env file
  if (!supabaseUrl || !supabaseKey) {
    try {
      const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
      const urlMatch = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/);
      const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/);
      if (urlMatch) supabaseUrl = urlMatch[1];
      if (keyMatch) supabaseKey = keyMatch[1];
    } catch {}
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 无法获取 Supabase 凭据');
    console.error('   请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
    console.error('   或确保 .env 文件包含正确的值');
    process.exit(1);
  }

  console.log('📡 连接到 Supabase:', supabaseUrl);

  // Test connection
  const testClient = createClient(supabaseUrl, supabaseKey);
  const { error: testErr } = await testClient.from('partners').select('id', { count: 'exact', head: true });
  if (testErr) {
    console.error('❌ 连接失败:', testErr.message);
    console.error('   API key 可能已失效，请从 Supabase Dashboard → Settings → API 获取新的 anon key');
    process.exit(1);
  }
  console.log('✅ 连接成功');

  // Read and execute migration SQL
  const migrations = [
    '20250620000001_partner_health_tables.sql',
    '20250615000001_comprehensive_partner_data.sql',
  ];

  for (const file of migrations) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  跳过 ${file} (不存在)`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`\n📦 执行 ${file} (${statements.length} 条语句)...`);

    for (let i = 0; i < statements.length; i++) {
      try {
        // Use the pg client or supabase rpc
        const { error } = await testClient.rpc('exec_sql', { query: statements[i] });
        if (error) {
          // If rpc not available, use direct REST
          console.log(`  ⚠️  语句 ${i+1}: ${error.message.substring(0, 60)}`);
        } else {
          console.log(`  ✅ 语句 ${i+1} 完成`);
        }
      } catch (e) {
        console.log(`  ⚠️  语句 ${i+1}: ${e.message.substring(0, 60)}`);
      }
    }
  }

  console.log('\n✅ 迁移完成');
  console.log('   如果某些语句失败，请在 Supabase Dashboard → SQL Editor 中手动执行');
  console.log(`   文件: ${path.join(__dirname, '..', 'supabase', 'migrations')}`);
}

main().catch(console.error);
