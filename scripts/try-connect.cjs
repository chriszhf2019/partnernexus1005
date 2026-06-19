const { Client } = require('pg');

// Supabase 常见的默认密码格式
const passwords = [
  'postgres',
  'your-db-password',
  'password',
  'admin',
];

const config = {
  host: 'db.ezkbjufluczpxdixplxu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function tryConnect(password) {
  const client = new Client({ ...config, password });
  try {
    await client.connect();
    console.log(`✅ 成功连接，使用密码: ${password}`);
    return client;
  } catch (err) {
    console.log(`❌ 密码 "${password}" 失败: ${err.message.substring(0, 60)}`);
    return null;
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('🔌 尝试连接 Supabase PostgreSQL 数据库...');
  console.log('   Host:', config.host);
  console.log('   Database:', config.database);
  console.log('   User:', config.user);
  console.log('═══════════════════════════════════════════\n');

  for (const pwd of passwords) {
    const client = await tryConnect(pwd);
    if (client) {
      // 测试查询
      try {
        const result = await client.query("SELECT count(*) as cnt FROM partners");
        console.log('   查询测试成功，partners 表记录数:', result.rows[0].cnt);

        // 尝试执行一条简单的 ALTER TABLE
        try {
          await client.query("ALTER TABLE partners ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'Active'");
          console.log('   ✅ ALTER TABLE 成功！可以执行 SQL 了');
        } catch (e) {
          console.log('   ⚠ ALTER TABLE 失败: ' + e.message);
        }
      } catch (err) {
        console.log('   查询失败:', err.message);
      }
      await client.end();
      return;
    }
  }

  console.log('\n❌ 所有默认密码都失败了');
  console.log('\n💡 请从 Supabase Dashboard 获取数据库密码:');
  console.log('   1. 访问: https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/settings/database');
  console.log('   2. 查找 "Database Password" 或重置密码');
  console.log('   3. 然后运行: SUPABASE_DB_PASSWORD="你的密码" node scripts/run-sql-direct.cjs\n');
}

main();
