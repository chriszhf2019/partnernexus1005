/**
 * Apply database optimization migration
 *
 * Usage:
 *   node scripts/apply-migration.cjs [connection-string]
 *
 * Connection string examples:
 *   Local:    postgresql://postgres:postgres@localhost:54322/postgres
 *   Remote:   postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
 *
 * If no connection string is provided, it tries local Supabase first,
 * then falls back to DATABASE_URL env var.
 */

const { readFileSync } = require('fs');
const { resolve } = require('path');
const { Client } = require('pg');

const MIGRATION_FILE = resolve(__dirname, '../supabase/migrations/20250618000020_db_optimization.sql');

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected!\n');

  const sql = readFileSync(MIGRATION_FILE, 'utf-8');

  // Check migration hasn't been applied
  const { rows } = await client.query(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'idx_deals_stage'`
  );
  if (rows.length > 0) {
    console.log('Migration appears to be already applied (idx_deals_stage exists).');
    console.log('Running anyway (all statements use IF NOT EXISTS)...');
  }

  // Run migration
  console.log('Applying migration...');
  await client.query(sql);
  console.log('Migration applied!');

  // Verify results
  console.log('\n=== VERIFICATION ===\n');

  // 1. Check indexes on deals
  const { rows: dealIndexes } = await client.query(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'deals'
    ORDER BY indexname
  `);
  console.log('Indexes on deals:');
  dealIndexes.forEach(i => console.log(`  ${i.indexname}`));

  // 2. Check trigger function exists
  const { rows: funcExists } = await client.query(`
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  `);
  console.log(`\nTrigger function: ${funcExists.length > 0 ? '✓ exists' : '✗ missing'}`);

  // 3. Check trigger on partners
  const { rows: trigExists } = await client.query(`
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trg_partners_updated_at'
  `);
  console.log(`Trigger on partners: ${trigExists.length > 0 ? '✓ exists' : '✗ missing'}`);

  // 4. Count total indexes created
  const { rows: allIndexes } = await client.query(`
    SELECT count(*)::int FROM pg_indexes
    WHERE indexname LIKE 'idx_%'
      AND indexname NOT LIKE '%_pkey'
      AND schemaname = 'public'
  `);
  console.log(`\nTotal application indexes: ${allIndexes[0].count}`);

  // 5. Count total triggers created
  const { rows: allTriggers } = await client.query(`
    SELECT count(*)::int FROM information_schema.triggers
    WHERE trigger_name LIKE 'trg_%_updated_at'
  `);
  console.log(`Updated_at triggers: ${allTriggers[0].count}`);

  // 6. Test trigger works
  await client.query(`
    CREATE TEMP TABLE _test_trigger (id int, name text, updated_at timestamptz default now())
  `);
  const { rows: [{ before }] } = await client.query(`SELECT updated_at as before FROM _test_trigger WHERE id IS NULL`);
  await new Promise(r => setTimeout(r, 100)); // wait 100ms
  await client.query(`UPDATE _test_trigger SET name = 'test' WHERE id IS NULL`);
  const { rows: [{ after }] } = await client.query(`SELECT updated_at as after FROM _test_trigger WHERE id IS NULL`);
  const changed = before.getTime() !== after.getTime();
  console.log(`Trigger test: ${changed ? '✓ updated_at changed' : '✗ not changed'}`);

  await client.end();
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
