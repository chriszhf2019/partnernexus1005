#!/usr/bin/env node
const { Client } = require('pg');

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
if (!dbPassword) { console.error('❌ SUPABASE_DB_PASSWORD required'); process.exit(1); }

async function migrate() {
  const client = new Client({
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Create incentive_applications table
    console.log('Creating incentive_applications...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS incentive_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        partner_name TEXT NOT NULL,
        partner_tier TEXT,
        metric TEXT NOT NULL,
        claimed_value NUMERIC NOT NULL,
        payout_amount NUMERIC NOT NULL,
        related_deals JSONB,
        supporting_documents JSONB,
        status TEXT DEFAULT 'pending',
        current_step INT DEFAULT 1,
        workflow_steps JSONB,
        approval_history JSONB,
        approved_by TEXT,
        approved_at TIMESTAMPTZ,
        invoice_number TEXT,
        tax_id TEXT,
        bank_account TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Created incentive_applications\n');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_incentive_applications_plan ON incentive_applications(plan_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_incentive_applications_partner ON incentive_applications(partner_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_incentive_applications_status ON incentive_applications(status)`);
    console.log('✅ Created indexes for incentive_applications\n');

    // Create incentive_participation_tracking table
    console.log('Creating incentive_participation_tracking...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS incentive_participation_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        partner_name TEXT NOT NULL,
        partner_tier TEXT,
        partner_region TEXT,
        partner_industry TEXT,
        is_participated BOOLEAN DEFAULT false,
        first_application_at TIMESTAMPTZ,
        total_applications INT DEFAULT 0,
        total_payout_received NUMERIC DEFAULT 0,
        deals_registered INT DEFAULT 0,
        deals_won INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Created incentive_participation_tracking\n');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_participation_plan ON incentive_participation_tracking(plan_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_participation_partner ON incentive_participation_tracking(partner_id)`);
    console.log('✅ Created indexes\n');

    // Create incentive_settlement_records table
    console.log('Creating incentive_settlement_records...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS incentive_settlement_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID NOT NULL REFERENCES incentive_applications(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES incentive_programs(id) ON DELETE CASCADE,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        settlement_amount NUMERIC NOT NULL,
        settlement_currency TEXT DEFAULT 'CNY',
        invoice_number TEXT,
        invoice_amount NUMERIC,
        invoice_date DATE,
        tax_rate NUMERIC DEFAULT 0.06,
        payment_method TEXT,
        bank_name TEXT,
        bank_account TEXT,
        account_name TEXT,
        status TEXT DEFAULT 'pending',
        payment_voucher_url TEXT,
        settled_by TEXT,
        settled_at TIMESTAMPTZ,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Created incentive_settlement_records\n');

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_settlement_application ON incentive_settlement_records(application_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_settlement_plan ON incentive_settlement_records(plan_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_settlement_partner ON incentive_settlement_records(partner_id)`);
    console.log('✅ Created indexes for incentive_settlement_records\n');

    console.log('🎉 All remaining tables created successfully!');

    await client.end();
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

migrate();