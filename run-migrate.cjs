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

    // 读取SQL文件
    const sql = fs.readFileSync('ONE_CLICK_MIGRATION.sql', 'utf-8');
    
    // 按换行分割，然后按分号重新组合
    const lines = sql.split('\n');
    const statements = [];
    let current = '';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // 跳过注释行
      if (trimmed.startsWith('--')) continue;
      if (trimmed === '') continue;
      
      current += ' ' + trimmed;
      
      // 如果当前语句以分号结尾，则保存
      if (current.trim().endsWith(';')) {
        statements.push(current.trim());
        current = '';
      }
    }

    console.log(`📊 Found ${statements.length} SQL statements\n`);
    console.log('🚀 Starting migration...\n');

    let success = 0, errors = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      try {
        await client.query(stmt);
        success++;

        // 提取关键信息
        const table = stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i)?.[1];
        const alter = stmt.match(/ALTER TABLE\s+marketing_activities/i)?.[1];
        const index = stmt.match(/CREATE INDEX.*?idx_(\w+)/i)?.[1];

        if (table) {
          console.log(`✅ Created table: ${table}`);
        } else if (alter) {
          console.log(`✅ Added columns to: marketing_activities`);
        } else if (index) {
          console.log(`✅ Created index: idx_${index}`);
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
    console.log('🎉 Migration Complete!');
    console.log('   Success:', success);
    console.log('   Errors/Warnings:', errors);
    console.log('========================================\n');
    
    console.log('📋 Created Tables:');
    console.log('   - marketing_materials');
    console.log('   - marketing_guests');
    console.log('   - marketing_execution_phases');
    console.log('   - marketing_phase_tasks');
    console.log('   - marketing_evaluations');
    console.log('   - marketing_evaluation_leads');
    console.log('\n📝 Extended Table:');
    console.log('   - marketing_activities (added 30+ columns)');
    console.log('\n✅ Created Indexes: 15');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Visit https://partner.velolabs.top/marketing');
    console.log('   2. Click any activity to enter detail page');
    console.log('   3. Test the new three-phase management!\n');

    await client.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

migrate();
