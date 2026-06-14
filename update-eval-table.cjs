#!/usr/bin/env node
// ⚠️ 已废弃 — 一次性升级脚本，通过 Supabase SQL Editor 手动执行即可
//     参考 scripts/SCRIPTS.md
const {Client}=require('pg');
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) { console.error('❌ SUPABASE_DB_PASSWORD required'); process.exit(1); }
const c=new Client({
  host:'db.ezkbjufluczpxdixplxu.supabase.co',port:5432,database:'postgres',user:'postgres',
  password:dbPassword,ssl:{rejectUnauthorized:false}
});

c.connect().then(async()=>{
  console.log('Updating marketing_evaluations table...');
  
  const columns = [
    'registered_count INT DEFAULT 0',
    'attendance_rate DECIMAL(5,2) DEFAULT 0',
    'target_client_ratio DECIMAL(5,2) DEFAULT 0',
    'mql_count INT DEFAULT 0',
    'sql_count INT DEFAULT 0',
    'content_score INT DEFAULT 0',
    'process_score INT DEFAULT 0',
    'nps_score INT DEFAULT 0',
    'favorite_session TEXT',
    'customer_highlights TEXT',
    'customer_pain_points TEXT',
    'budget_total DECIMAL(12,2) DEFAULT 0',
    'budget_actual DECIMAL(12,2) DEFAULT 0',
    'budget_execution_rate DECIMAL(5,2) DEFAULT 0',
    'cpl DECIMAL(12,2) DEFAULT 0',
    'estimated_deal_amount DECIMAL(15,2) DEFAULT 0',
    'channel_performance TEXT',
    'follow_up_actions TEXT',
    'competitor_dynamics TEXT',
    'ksf TEXT',
    'risk_warnings TEXT',
    'follow_up_plan TEXT',
    'todo_tasks TEXT'
  ];
  
  let success = 0, errors = 0;
  for (const col of columns) {
    try {
      await c.query(`ALTER TABLE marketing_evaluations ADD COLUMN IF NOT EXISTS ${col}`);
      console.log('✅ Added:', col.split(' ')[0]);
      success++;
    } catch(e) {
      console.log('⚠️', e.message.substring(0, 60));
      errors++;
    }
  }
  
  console.log('\nDone! Success:', success, 'Errors:', errors);
  await c.end();
}).catch(e=>console.error('❌',e.message));
