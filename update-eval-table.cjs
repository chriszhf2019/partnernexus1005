#!/usr/bin/env node
const {Client}=require('pg');
const c=new Client({
  host:'db.ezkbjufluczpxdixplxu.supabase.co',port:5432,database:'postgres',user:'postgres',
  password:'tmee9YJt4ryV3rbZ',ssl:{rejectUnauthorized:false}
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
