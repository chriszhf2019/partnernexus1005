// Run database migration for PartnerNexus
// Usage: node scripts/run-migration.js
// Connects to Supabase and creates global_settings table + missing marketing_activities columns

const { Client } = require('pg');
const path = require('path');

const SQL = `
CREATE TABLE IF NOT EXISTS global_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  currency TEXT DEFAULT 'CNY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO global_settings (id, currency) VALUES ('default', 'CNY')
  ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'host_type') THEN
    ALTER TABLE marketing_activities ADD COLUMN host_type TEXT DEFAULT 'vendor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'partner_id') THEN
    ALTER TABLE marketing_activities ADD COLUMN partner_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'partner_name') THEN
    ALTER TABLE marketing_activities ADD COLUMN partner_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'location') THEN
    ALTER TABLE marketing_activities ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'description') THEN
    ALTER TABLE marketing_activities ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'contact_name') THEN
    ALTER TABLE marketing_activities ADD COLUMN contact_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'contact_phone') THEN
    ALTER TABLE marketing_activities ADD COLUMN contact_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'max_attendees') THEN
    ALTER TABLE marketing_activities ADD COLUMN max_attendees INT DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_questions') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_questions BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'enable_lottery') THEN
    ALTER TABLE marketing_activities ADD COLUMN enable_lottery BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'lottery_reward') THEN
    ALTER TABLE marketing_activities ADD COLUMN lottery_reward TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'signup_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN signup_points INT DEFAULT 10;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'checkin_points') THEN
    ALTER TABLE marketing_activities ADD COLUMN checkin_points INT DEFAULT 20;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'invitation_code') THEN
    ALTER TABLE marketing_activities ADD COLUMN invitation_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_activities' AND column_name = 'expected_attendees') THEN
    ALTER TABLE marketing_activities ADD COLUMN expected_attendees INT DEFAULT 0;
  END IF;
END $$;

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow read global_settings" ON global_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow upsert global_settings" ON global_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow update global_settings" ON global_settings FOR UPDATE USING (auth.role() = 'authenticated');
`;

async function run() {
  const client = new Client({
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'YOUR_PASSWORD',
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected. Running migration...');
    await client.query(SQL);
    console.log('✅ Migration executed successfully!');
    console.log('');
    console.log('Created:');
    console.log('  - global_settings table (with default CNY row)');
    console.log('  - RLS policies for global_settings');
    console.log('Added columns to marketing_activities (if missing):');
    console.log('  - host_type, partner_id, partner_name, location, description');
    console.log('  - contact_name, contact_phone, max_attendees');
    console.log('  - enable_questions, enable_lottery, lottery_reward');
    console.log('  - signup_points, checkin_points, invitation_code');
    console.log('  - expected_attendees');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.position) {
      const pos = parseInt(err.position);
      console.error('Around position', pos, ':', SQL.substring(Math.max(0, pos - 80), pos + 80));
    }
  } finally {
    await client.end();
  }
}

run();
