#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'db.ezkbjufluczpxdixplxu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'set-via-env',
  ssl: { rejectUnauthorized: false },
});

const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250609000012_deal_optimization.sql');

async function runMigration() {
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const client = await pool.connect();

  try {
    console.log('Connected to Supabase. Running migration...\n');
    const result = await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Full migration error:', err.message);

    // Try statement-by-statement
    console.log('\nTrying individual statements...\n');
    const statements = [];
    let current = '';
    let inDoBlock = false;

    for (const line of sql.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      current += line + '\n';

      if (trimmed.toUpperCase().startsWith('DO $$') || trimmed.toUpperCase().startsWith('DO$$')) {
        inDoBlock = true;
      }
      if (trimmed === 'END $$;' || trimmed === 'END$$;') {
        inDoBlock = false;
        statements.push(current.trim());
        current = '';
        continue;
      }
      if (!inDoBlock && trimmed.endsWith(';')) {
        statements.push(current.trim());
        current = '';
      }
    }
    if (current.trim()) statements.push(current.trim());

    let ok = 0, skip = 0, fail = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
      try {
        await client.query(stmt);
        console.log(`[OK]   ${i + 1}/${statements.length}: ${preview}...`);
        ok++;
      } catch (e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate key')) {
          console.log(`[SKIP] ${i + 1}/${statements.length}: ${preview}...`);
          skip++;
        } else {
          console.error(`[FAIL] ${i + 1}/${statements.length}: ${preview}...`);
          console.error(`       ${e.message}`);
          fail++;
        }
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`  OK: ${ok}, Skipped: ${skip}, Failed: ${fail}`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
