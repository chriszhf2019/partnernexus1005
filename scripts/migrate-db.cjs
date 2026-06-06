const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Supabase connection string - 需要从Supabase Dashboard获取实际的数据库密码
  // 格式: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
  const connectionConfig = {
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || 'your-db-password', // 需要设置数据库密码
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log('🔄 连接到 Supabase 数据库...');
  console.log('   Host:', connectionConfig.host);

  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('✅ 连接成功！');

    // 读取迁移文件
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250606000009_marketing_activity_management.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 读取迁移文件成功');
    console.log('🚀 开始执行迁移...\n');

    // 分割SQL语句并执行
    const statements = sql
      .split(/;[\s]*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length === 0 || statement.startsWith('--')) continue;

      try {
        await client.query(statement + ';');
        successCount++;
        
        // 提取表名（简化显示）
        const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
        if (tableMatch) {
          console.log(`  ✅ 创建表: ${tableMatch[1]}`);
        } else if (statement.includes('ALTER TABLE')) {
          console.log(`  ✅ 修改表: ${statement.match(/marketing_\w+/)?.[0]}`);
        } else if (statement.includes('CREATE INDEX')) {
          console.log(`  ✅ 创建索引`);
        }
      } catch (err) {
        errorCount++;
        console.error(`  ❌ 执行失败: ${err.message}`);
        // 继续执行其他语句
      }
    }

    console.log('\n========================================');
    console.log(`✅ 迁移完成！`);
    console.log(`   成功: ${successCount} 条`);
    console.log(`   失败: ${errorCount} 条`);
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
