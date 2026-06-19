import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m'
};

function log(msg, color = 'reset') { console.log(`${colors[color]}${msg}${colors.reset}`); }

async function main() {
  const sqlFilePath = process.argv[2];
  if (!sqlFilePath) {
    log('\n❌ 用法: node scripts/exec-sql.mjs <path-to-sql-file>', 'red');
    log('   示例: node scripts/exec-sql.mjs supabase/migrations/20250615000002_lifecycle_system_v2.sql\n', 'reset');
    process.exit(1);
  }

  const absPath = path.resolve(sqlFilePath);
  if (!fs.existsSync(absPath)) {
    log(`\n❌ 找不到文件: ${absPath}`, 'red');
    process.exit(1);
  }

  const sql = fs.readFileSync(absPath, 'utf-8');

  log('\n═══════════════════════════════════════════════════════════════', 'blue');
  log(`📄 执行文件: ${absPath}`, 'cyan');
  log(`📐 SQL 大小: ${sql.length} 字符`, 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  // 策略1: 使用 service_role key 调用 exec 函数
  if (supabaseServiceKey) {
    log('🔑 策略1: 使用 SUPABASE_SERVICE_ROLE_KEY 调用 exec() 函数', 'blue');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // 将 SQL 分割成多条语句执行，避免过长
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      log(`   共 ${statements.length} 条语句`, 'cyan');

      let success = 0, failed = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          const { data, error } = await supabase.rpc('exec', { query: stmt });
          if (error) {
            log(`   ⚠️  [${i + 1}/${statements.length}] ${error.message.substring(0, 80)}`, 'yellow');
            failed++;
          } else {
            // 提取表名以便显示
            const tableMatch = stmt.match(/TABLE(?: IF NOT EXISTS)?\s+(\w+)/i);
            const alterMatch = stmt.match(/ALTER TABLE\s+(\w+)/i);
            const colMatch = stmt.match(/ADD COLUMN IF NOT EXISTS\s+(\w+)/i);

            let msg = `   ✅ [${i + 1}/${statements.length}] `;
            if (alterMatch && colMatch) msg += `ALTER ${alterMatch[1]} ADD ${colMatch[1]}`;
            else if (tableMatch) msg += `CREATE TABLE ${tableMatch[1]}`;
            else msg += `执行成功`;

            log(msg, 'green');
            success++;
          }
        } catch (err) {
          log(`   ❌ [${i + 1}/${statements.length}] ${err.message.substring(0, 80)}`, 'red');
          failed++;
        }
      }

      log(`\n✅ 完成: 成功 ${success} 条, 跳过/失败 ${failed} 条`, 'green');
      process.exit(0);
    } catch (err) {
      log(`   ❌ exec() 函数失败: ${err.message}`, 'red');
    }
  } else {
    log('   ⚠️  未设置 SUPABASE_SERVICE_ROLE_KEY，跳过策略1', 'yellow');
  }

  // 策略2: 使用数据库密码直接连接 pg
  if (dbPassword) {
    log('\n🔑 策略2: 使用 SUPABASE_DB_PASSWORD 直接连接 PostgreSQL', 'blue');

    try {
      const { Client } = await import('pg');
      const client = new Client({
        host: 'db.ezkbjufluczpxdixplxu.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: dbPassword,
        ssl: { rejectUnauthorized: false }
      });

      await client.connect();
      log('   ✅ 连接成功', 'green');

      const statements = sql
        .split(/;[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let success = 0, failed = 0;
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          await client.query(stmt);
          const tableMatch = stmt.match(/TABLE(?: IF NOT EXISTS)?\s+(\w+)/i);
          const alterMatch = stmt.match(/ALTER TABLE\s+(\w+)/i);
          const colMatch = stmt.match(/ADD COLUMN IF NOT EXISTS\s+(\w+)/i);

          let msg = `   ✅ [${i + 1}/${statements.length}] `;
          if (alterMatch && colMatch) msg += `ALTER ${alterMatch[1]} ADD ${colMatch[1]}`;
          else if (tableMatch) msg += `CREATE TABLE ${tableMatch[1]}`;
          else msg += `OK`;

          log(msg, 'green');
          success++;
        } catch (err) {
          log(`   ⚠️  [${i + 1}/${statements.length}] ${err.message.substring(0, 80)}`, 'yellow');
          failed++;
        }
      }

      await client.end();
      log(`\n✅ 完成: 成功 ${success} 条, 跳过 ${failed} 条`, 'green');
      process.exit(0);
    } catch (err) {
      log(`   ❌ PostgreSQL 连接失败: ${err.message}`, 'red');
    }
  } else {
    log('   ⚠️  未设置 SUPABASE_DB_PASSWORD，跳过策略2', 'yellow');
  }

  // 如果都失败了
  log('\n═══════════════════════════════════════════════════════════════', 'red');
  log('❌ 无法执行 SQL。请设置以下任一环境变量：', 'red');
  log('═══════════════════════════════════════════════════════════════\n', 'red');
  log('   1. SUPABASE_SERVICE_ROLE_KEY（推荐，通过 Supabase API 执行）', 'yellow');
  log('      来源: Supabase Dashboard → Project Settings → API → service_role secret\n', 'reset');
  log('   2. SUPABASE_DB_PASSWORD（直接连接 PostgreSQL）', 'yellow');
  log('      来源: Supabase Dashboard → Project Settings → Database → Password\n', 'reset');
  log('   设置后运行：', 'cyan');
  log('      SUPABASE_SERVICE_ROLE_KEY="your_key" node scripts/exec-sql.mjs <sql-file>', 'reset');
  log('      或', 'reset');
  log('      SUPABASE_DB_PASSWORD="your_password" node scripts/exec-sql.mjs <sql-file>\n', 'reset');

  process.exit(1);
}

main();
