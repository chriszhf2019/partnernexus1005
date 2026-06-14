#!/usr/bin/env node
const { Client } = require('pg');
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) { console.error('❌ SUPABASE_DB_PASSWORD required'); process.exit(1); }
const client = new Client({
  host: 'db.ezkbjufluczpxdixplxu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function checkTables() {
  await client.connect();
  
  const tables = [
    'incentive_tier_rules',
    'incentive_targeting_rules', 
    'incentive_templates',
    'incentive_applications',
    'incentive_budget_alerts',
    'incentive_roi_tracking',
    'incentive_participation_tracking',
    'incentive_settlement_records'
  ];
  
  console.log('检查数据库表状态:\n');
  
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ ${table}: ${res.rows[0].count} 条记录`);
    } catch(e) {
      console.log(`❌ ${table}: ${e.message.split('\n')[0]}`);
    }
  }
  
  await client.end();
}
checkTables().catch(console.error);