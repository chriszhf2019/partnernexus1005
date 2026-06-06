#!/usr/bin/env node
const {Client}=require('pg');
const c=new Client({
  host:'db.ezkbjufluczpxdixplxu.supabase.co',port:5432,database:'postgres',user:'postgres',
  password:'tmee9YJt4ryV3rbZ',ssl:{rejectUnauthorized:false}
});
c.connect().then(async()=>{
  console.log('Creating missing tables...');
  try{
    await c.query(`
      CREATE TABLE marketing_guests(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id UUID NOT NULL,
        name TEXT NOT NULL,
        company TEXT,title TEXT,phone TEXT,email TEXT,
        status TEXT DEFAULT 'invited',
        partner_id UUID,partner_name TEXT,assigned_to TEXT,
        notes TEXT,tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ marketing_guests created');
  }catch(e){console.log('⚠️ guests:',e.message.substring(0,80))}
  
  try{
    await c.query(`
      CREATE TABLE marketing_evaluation_leads(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        evaluation_id UUID NOT NULL,
        activity_id UUID NOT NULL,
        guest_id UUID,name TEXT,company TEXT,title TEXT,phone TEXT,email TEXT,
        quality TEXT DEFAULT 'medium',notes TEXT,
        is_converted BOOLEAN DEFAULT false,
        converted_deal_id UUID,converted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ marketing_evaluation_leads created');
  }catch(e){console.log('⚠️ leads:',e.message.substring(0,80))}
  
  console.log('Done!');
  await c.end();
}).catch(e=>console.error('❌',e.message));
