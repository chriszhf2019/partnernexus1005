const { Pool } = require('pg');
const pool = new Pool({
  host: 'db.ezkbjufluczpxdixplxu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'set-via-env',
  ssl: { rejectUnauthorized: false },
});

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';
const functionUrl1 = 'https://ezkbjufluczpxdixplxu.supabase.co/functions/v1/check-protection-rules';
const functionUrl2 = 'https://ezkbjufluczpxdixplxu.supabase.co/functions/v1/check-expiry-reminders';

async function setupCron() {
  const c = await pool.connect();
  try {
    // Remove existing jobs if any
    try { await c.query("SELECT cron.unschedule('check-protection-rules')"); } catch(e) {}
    try { await c.query("SELECT cron.unschedule('check-expiry-reminders')"); } catch(e) {}

    // Schedule check-protection-rules at 2:00 AM daily
    await c.query(
      "SELECT cron.schedule('check-protection-rules', '0 2 * * *', " +
      "$_$SELECT net.http_post(url := '" + functionUrl1 + "', headers := '{\"Authorization\": \"Bearer " + serviceKey + "\"}'::jsonb)$_$)"
    );
    console.log('Scheduled check-protection-rules at 2:00 AM daily');

    // Schedule check-expiry-reminders at 9:00 AM daily
    await c.query(
      "SELECT cron.schedule('check-expiry-reminders', '0 9 * * *', " +
      "$_$SELECT net.http_post(url := '" + functionUrl2 + "', headers := '{\"Authorization\": \"Bearer " + serviceKey + "\"}'::jsonb)$_$)"
    );
    console.log('Scheduled check-expiry-reminders at 9:00 AM daily');

    const { rows } = await c.query('SELECT jobname, schedule, active FROM cron.job ORDER BY jobname');
    console.log('Active cron jobs:', JSON.stringify(rows, null, 2));
  } finally {
    c.release();
    await pool.end();
  }
}

setupCron().catch(err => { console.error(err.message); process.exit(1); });
