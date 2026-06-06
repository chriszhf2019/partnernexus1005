#!/usr/bin/env node

/**
 * Supabase 数据库迁移执行器
 * 
 * 使用方法：
 * 1. 在 Supabase Dashboard 获取数据库密码
 * 2. 设置环境变量: export SUPABASE_DB_PASSWORD="your-password"
 * 3. 运行: node scripts/execute-migration.cjs
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase 配置
const config = {
  host: 'db.ezkbjufluczpxdixplxu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeMigration() {
  // 检查密码
  if (!config.password) {
    log('\n❌ 错误：未设置数据库密码！\n', 'red');
    log('请设置环境变量 SUPABASE_DB_PASSWORD', 'yellow');
    log('\n步骤：', 'cyan');
    log('1. 登录 https://supabase.com/dashboard', 'reset');
    log('2. 选择项目 sutfazpqcpwxfzzyhforj', 'reset');
    log('3. 进入 Settings > Database', 'reset');
    log('4. 复制 "Connection string" 中的密码', 'reset');
    log('5. 运行: export SUPABASE_DB_PASSWORD="your-password"', 'reset');
    log('6. 然后重新运行此脚本\n', 'reset');
    process.exit(1);
  }

  log('\n🔄 正在连接 Supabase 数据库...', 'blue');
  log(`   Host: ${config.host}`, 'cyan');

  const client = new Client(config);

  try {
    await client.connect();
    log('✅ 连接成功！\n', 'green');

    // 读取迁移文件
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20250606000009_marketing_activity_management.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      log(`❌ 找不到迁移文件: ${migrationPath}`, 'red');
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    log('📄 读取迁移文件成功', 'blue');
    log('🚀 开始执行迁移...\n', 'blue');

    // 分割并执行 SQL 语句
    const statements = sql
      .split(/;[\r\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // 跳过注释和空语句
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      try {
        await client.query(statement + ';');
        successCount++;

        // 提取关键信息
        const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
        const alterMatch = statement.match(/ALTER TABLE\s+(\w+)/i);
        const indexMatch = statement.match(/CREATE INDEX(?: IF NOT EXISTS)?\s+(\w+)/i);
        const insertMatch = statement.match(/INSERT INTO\s+(\w+)/i);

        if (tableMatch) {
          log(`  ✅ 创建表: ${tableMatch[1]}`, 'green');
        } else if (alterMatch) {
          log(`  ✅ 修改表: ${alterMatch[1]}`, 'green');
        } else if (indexMatch) {
          log(`  ✅ 创建索引: ${indexMatch[1]}`, 'green');
        } else if (insertMatch) {
          log(`  ✅ 插入数据: ${insertMatch[1]}`, 'green');
        }

      } catch (err) {
        errorCount++;
        const errorMsg = err.message.substring(0, 100);
        errors.push({ statement: statement.substring(0, 50), error: errorMsg });
        log(`  ⚠️  执行警告: ${errorMsg}`, 'yellow');
      }
    }

    // 输出结果
    log('\n' + '='.repeat(60), 'blue');
    log('📊 迁移执行结果', 'blue');
    log('=' .repeat(60), 'blue');
    log(`✅ 成功: ${successCount} 条`, 'green');
    
    if (errorCount > 0) {
      log(`⚠️  警告: ${errorCount} 条`, 'yellow');
      log('\n错误详情：', 'yellow');
      errors.forEach((e, i) => {
        log(`  ${i + 1}. ${e.error}`, 'red');
      });
    } else {
      log(`❌ 失败: ${errorCount} 条`, 'green');
    }
    
    log('=' .repeat(60), 'blue');
    log('\n🎉 数据库迁移完成！', 'green');
    log('\n下一步：', 'cyan');
    log('1. 访问 https://partner.velolabs.top/marketing', 'reset');
    log('2. 点击任意活动进入详情页', 'reset');
    log('3. 测试新的三阶段管理功能\n', 'reset');

  } catch (err) {
    log(`\n❌ 连接失败: ${err.message}`, 'red');
    log('\n请检查：', 'yellow');
    log('- 数据库密码是否正确', 'reset');
    log('- 网络连接是否正常', 'reset');
    log('- Supabase 项目是否可用', 'reset');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 运行迁移
executeMigration();
