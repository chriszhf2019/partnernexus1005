const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSQLFile(filePath) {
  const config = {
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  };

  if (!config.password) {
    log('\n❌ 错误：未设置 SUPABASE_DB_PASSWORD 环境变量！', 'red');
    log('请先设置: export SUPABASE_DB_PASSWORD="your-db-password"', 'yellow');
    log('获取密码：登录 Supabase Dashboard → Project Settings → Database\n', 'reset');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    log(`\n❌ 找不到文件: ${absolutePath}`, 'red');
    process.exit(1);
  }

  log('\n═══════════════════════════════════════════════════════════════', 'blue');
  log(`📄 执行文件: ${absolutePath}`, 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'blue');

  log('🔄 连接到 Supabase 数据库...', 'blue');
  log(`   Host: ${config.host}`, 'cyan');

  const client = new Client(config);

  try {
    await client.connect();
    log('✅ 连接成功！\n', 'green');

    const sql = fs.readFileSync(absolutePath, 'utf-8');
    log(`📄 SQL 文件大小: ${sql.length} 字节`, 'blue');
    log('🚀 开始执行...\n', 'blue');

    const statements = sql
      .split(/;[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const tablesCreated = new Set();

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.trim() === '') continue;

      try {
        await client.query(statement);
        successCount++;

        const tableMatch = statement.match(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/i);
        const alterMatch = statement.match(/ALTER TABLE\s+(\w+)/i);
        const indexMatch = statement.match(/CREATE(?: UNIQUE)? INDEX(?: IF NOT EXISTS)?\s+(\w+)/i);
        const insertMatch = statement.match(/INSERT INTO\s+(\w+)/i);
        const policyMatch = statement.match(/CREATE(?: OR REPLACE)? POLICY\s+(\w+)/i);
        const triggerMatch = statement.match(/CREATE(?: OR REPLACE)? TRIGGER\s+(\w+)/i);
        const funcMatch = statement.match(/CREATE(?: OR REPLACE)? FUNCTION\s+(\w+)/i);

        if (tableMatch) {
          tablesCreated.add(tableMatch[1]);
          log(`  ✅ [${i + 1}/${statements.length}] 创建表: ${tableMatch[1]}`, 'green');
        } else if (alterMatch) {
          log(`  ✅ [${i + 1}/${statements.length}] 修改表结构: ${alterMatch[1]}`, 'green');
        } else if (indexMatch) {
          log(`  ✅ [${i + 1}/${statements.length}] 创建索引: ${indexMatch[1]}`, 'green');
        } else if (policyMatch) {
          log(`  ✅ [${i + 1}/${statements.length}] 创建策略: ${policyMatch[1]}`, 'cyan');
        } else if (triggerMatch) {
          log(`  ✅ [${i + 1}/${statements.length}] 创建触发器: ${triggerMatch[1]}`, 'cyan');
        } else if (funcMatch) {
          log(`  ✅ [${i + 1}/${statements.length}] 创建函数: ${funcMatch[1]}`, 'magenta');
        } else if (insertMatch) {
          log(`  ✅ [${i + 1}/${statements.length}] 插入数据: ${insertMatch[1]}`, 'green');
        }

      } catch (err) {
        errorCount++;
        const errorMsg = err.message;
        errors.push({ index: i + 1, error: errorMsg });
        log(`  ⚠️  [${i + 1}/${statements.length}] 警告: ${errorMsg.substring(0, 100)}`, 'yellow');
      }
    }

    log('\n═══════════════════════════════════════════════════════════════', 'blue');
    log('📊 执行结果统计', 'blue');
    log('═══════════════════════════════════════════════════════════════', 'blue');
    log(`✅ 成功执行: ${successCount} 条语句`, 'green');
    if (errorCount > 0) {
      log(`⚠️  警告/跳过: ${errorCount} 条 (通常是表已存在等情况)`, 'yellow');
      if (errors.length > 0 && errors.length <= 10) {
        log('\n详细信息：', 'yellow');
        errors.forEach((e, i) => {
          log(`  ${i + 1}. ${e.error}`, 'red');
        });
      }
    }

    if (tablesCreated.size > 0) {
      log(`\n📋 本次创建/确认的表 (${tablesCreated.size}个):`, 'cyan');
      tablesCreated.forEach(t => log(`   • ${t}`, 'reset'));
    }

    log('\n═══════════════════════════════════════════════════════════════', 'blue');
    log('🎉 SQL 执行完成！\n', 'green');

  } catch (err) {
    log(`\n❌ 执行失败: ${err.message}`, 'red');
    log('\n请检查：', 'yellow');
    log('• 数据库密码是否正确', 'reset');
    log('• 网络连接是否正常', 'reset');
    log('• SQL 语法是否正确\n', 'reset');
    process.exit(1);
  } finally {
    await client.end();
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  log('\n❌ 请提供要执行的 SQL 文件路径！', 'red');
  log('\n用法:', 'yellow');
  log('  node scripts/run-sql.cjs <path-to-sql-file>', 'reset');
  log('\n示例:', 'yellow');
  log('  node scripts/run-sql.cjs supabase/migrations/20250615000002_lifecycle_system_v2.sql', 'reset');
  log('  node scripts/run-sql.cjs scripts/DATABASE_COMPLETE_FIX.sql\n', 'reset');
  process.exit(1);
}

executeSQLFile(args[0]);
