#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');

async function migrate() {
  const client = new Client({
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'tmee9YJt4ryV3rbZ',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 读取激励政策优化迁移文件
    const sql = fs.readFileSync('supabase/migrations/20250608000011_incentive_policy_optimization.sql', 'utf-8');
    
    // 改进的SQL语句解析逻辑
    const statements = [];
    let currentStatement = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBlockComment = false;
    
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const nextChar = sql[i + 1];
      
      // 处理块注释
      if (!inSingleQuote && !inDoubleQuote) {
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        if (char === '*' && nextChar === '/') {
          inBlockComment = false;
          i++;
          continue;
        }
      }
      
      if (inBlockComment) continue;
      
      // 处理行注释
      if (!inSingleQuote && !inDoubleQuote && char === '-' && nextChar === '-') {
        // 跳过整行
        while (i < sql.length && sql[i] !== '\n') {
          i++;
        }
        continue;
      }
      
      // 处理字符串
      if (char === '\'' && !inDoubleQuote && sql[i - 1] !== '\\') {
        inSingleQuote = !inSingleQuote;
      }
      if (char === '"' && !inSingleQuote && sql[i - 1] !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      }
      
      // 检查分号结束
      if (char === ';' && !inSingleQuote && !inDoubleQuote) {
        const trimmed = currentStatement.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed + ';');
        }
        currentStatement = '';
        continue;
      }
      
      currentStatement += char;
    }

    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('🚀 Starting incentive policy optimization migration...\n');

    let success = 0, errors = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      try {
        await client.query(stmt);
        success++;

        // 提取关键信息
        const table = stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i)?.[1];
        const index = stmt.match(/CREATE INDEX.*?idx_(\w+)/i)?.[1];
        const insert = stmt.match(/INSERT INTO\s+(\w+)/i)?.[1];

        if (table) {
          console.log(`✅ Created table: ${table}`);
        } else if (index) {
          console.log(`✅ Created index: idx_${index}`);
        } else if (insert) {
          console.log(`✅ Inserted data into: ${insert}`);
        }
      } catch(e) {
        errors++;
        // 忽略"already exists"错误
        if (!e.message.includes('already exists') && !e.message.includes('does not exist')) {
          console.log(`⚠️  Error: ${e.message.substring(0, 120)}`);
        }
      }
    }

    console.log('\n========================================');
    console.log('🎉 Incentive Policy Migration Complete!');
    console.log('   Success:', success);
    console.log('   Errors/Warnings:', errors);
    console.log('========================================\n');
    
    console.log('📋 Created Tables:');
    console.log('   - incentive_tier_rules');
    console.log('   - incentive_targeting_rules');
    console.log('   - incentive_templates');
    console.log('   - incentive_applications');
    console.log('   - incentive_budget_alerts');
    console.log('   - incentive_roi_tracking');
    console.log('   - incentive_participation_tracking');
    console.log('   - incentive_settlement_records');
    console.log('\n✅ Created Indexes: 15');

    await client.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

migrate();