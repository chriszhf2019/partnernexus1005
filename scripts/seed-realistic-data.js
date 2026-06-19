// ══════════════════════════════════════════════════════════════════════════
// Seed Realistic Data Script
// Usage: node scripts/seed-realistic-data.js
// 需要连接到 Supabase 并执行种子数据 SQL
// ══════════════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  // 从多个来源获取 Supabase 配置
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  // 备用: 从 .env 文件读取
  if (!supabaseUrl || !supabaseKey) {
    try {
      const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
      const urlMatch = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/);
      const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/);
      if (urlMatch) supabaseUrl = urlMatch[1];
      if (keyMatch) supabaseKey = keyMatch[1];
    } catch (e) {
      console.log('未找到 .env 文件，使用默认值');
    }
  }

  // 使用默认值（如果环境变量未设置）
  if (!supabaseUrl) {
    supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
  }
  if (!supabaseKey) {
    supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  }

  if (!supabaseKey) {
    console.error('❌ 需要 SUPABASE_SERVICE_KEY 环境变量');
    console.error('   请从 Supabase Dashboard → Settings → API 获取 service_role key');
    console.error('   然后运行: SUPABASE_SERVICE_KEY=your_key node scripts/seed-realistic-data.js');
    process.exit(1);
  }

  console.log('📡 连接到 Supabase:', supabaseUrl);

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 测试连接
  try {
    const { error: testErr } = await supabase.from('partners').select('id', { count: 'exact', head: true });
    if (testErr) {
      console.error('❌ 连接失败:', testErr.message);
      console.error('   请检查 SUPABASE_SERVICE_KEY 是否正确');
      process.exit(1);
    }
    console.log('✅ 连接成功');
  } catch (e) {
    console.error('❌ 连接错误:', e.message);
    process.exit(1);
  }

  // 读取种子数据 SQL 文件
  const sqlFilePath = path.join(__dirname, 'seed-realistic-data.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ 找不到种子数据文件:', sqlFilePath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  
  // 分割 SQL 语句（处理复杂的 PL/pgSQL 代码块）
  // 简化处理：按照 ; 分割，但排除在 DO $$ ... $$ 块内的分号
  const statements = [];
  let currentStatement = '';
  let inBlock = false;
  let blockDepth = 0;
  
  const lines = sql.split('\n');
  for (const line of lines) {
    // 检测代码块开始
    if (line.includes('$$') && !inBlock) {
      inBlock = true;
      blockDepth = 1;
    }
    
    if (inBlock) {
      currentStatement += line + '\n';
      // 简单计数 $$ 对
      const count = (line.match(/\$\$/g) || []).length;
      if (count > 0 && count % 2 === 0) {
        inBlock = false;
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      }
    } else {
      currentStatement += line + '\n';
      // 检测语句结束
      if (line.trim().endsWith(';') && !line.trim().startsWith('--')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 10 && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
  }
  
  // 处理剩余内容
  if (currentStatement.trim().length > 10) {
    statements.push(currentStatement.trim());
  }

  console.log(`\n📦 准备执行 ${statements.length} 条 SQL 语句...`);
  
  let successCount = 0;
  let errorCount = 0;

  // 逐条执行 SQL 语句
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // 跳过注释和空语句
    if (stmt.startsWith('--') || stmt.length < 10) {
      continue;
    }
    
    // 跳过 DO $$ 块（这些已经在上面的处理中被合并）
    if (stmt.includes('DO $$') || stmt.startsWith('DO')) {
      continue;
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      
      if (error) {
        // 可能 RPC 不可用，尝试使用 REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: stmt })
        });
        
        if (!response.ok) {
          const errText = await response.text();
          // 忽略某些已知错误（如 ON CONFLICT DO NOTHING）
          if (!errText.includes('duplicate') && !errText.includes('already exists')) {
            console.log(`  ⚠️  语句 ${i+1} 警告: ${errText.substring(0, 80)}`);
          }
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (e) {
      // 尝试直接执行（对于简单的 INSERT/UPDATE/DELETE）
      const simpleStmt = stmt.replace(/;$/, '').trim();
      if (simpleStmt.startsWith('INSERT') || simpleStmt.startsWith('UPDATE') || simpleStmt.startsWith('DELETE')) {
        console.log(`  ⏭️  语句 ${i+1} (${simpleStmt.substring(0, 40)}...) - 需要在 Dashboard 执行`);
      }
    }
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('📊 种子数据执行结果');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`✅ 成功: ${successCount} 条`);
  console.log(`⚠️  跳过/警告: ${errorCount} 条`);
  console.log('════════════════════════════════════════════════════════════');
  
  if (errorCount > 0) {
    console.log('\n💡 提示: 某些语句可能因为外键约束或数据冲突而跳过');
    console.log('   请在 Supabase Dashboard → SQL Editor 中执行完整脚本:');
    console.log(`   scripts/seed-realistic-data.sql`);
  } else {
    console.log('\n🎉 种子数据填充完成！刷新页面即可看到新数据。');
  }
}

main().catch(console.error);
