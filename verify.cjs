#!/usr/bin/env node
// ⚠️ 已废弃 — 请改用 scripts/check-tables.cjs
//     参考 scripts/SCRIPTS.md
const {Client} = require('pg');
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) { console.error('❌ SUPABASE_DB_PASSWORD required'); process.exit(1); }
const c = new Client({
  host: 'db.ezkbjufluczpxdixplxu.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: dbPassword, ssl: {rejectUnauthorized: false}
});

c.connect().then(async () => {
  console.log('\n📋 Database Verification\n');
  
  const tables = ['marketing_materials','marketing_guests','marketing_execution_phases',
                 'marketing_phase_tasks','marketing_evaluations','marketing_evaluation_leads'];
  
  let allOk = true;
  for (const t of tables) {
    const {rows} = await c.query(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=$1", [t]);
    const exists = rows[0].count > 0;
    console.log((exists ? '✅' : '❌') + ' ' + t);
    if (!exists) allOk = false;
  }
  
  const {rows: cols} = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_activities' AND column_name IN ('province','city','location','description')");
  
  console.log('\n📝 marketing_activities: ' + cols.length + ' new columns');
  
  console.log('\n========================================');
  console.log(allOk && cols.length >= 4 ? '✅ All Migration Complete!' : '⚠️ Partial Migration');
  console.log('========================================\n');
  console.log('🌐 Visit: https://partner.velolabs.top/marketing');
  console.log('📝 Click any activity to test the new features!\n');
  
  await c.end();
  process.exit(0);
}).catch(e => { console.error('❌', e.message); process.exit(1); });
