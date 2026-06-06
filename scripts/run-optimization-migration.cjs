#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ezkbjufluczpxdixplxu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250609000012_deal_optimization.sql');

async function runMigration() {
  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Split by semicolons, but handle DO blocks properly
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
      if (current.trim()) {
        statements.push(current.trim());
        current = '';
      }
      continue;
    }

    if (!inDoBlock && trimmed.endsWith(';')) {
      if (current.trim()) {
        statements.push(current.trim());
        current = '';
      }
    }
  }

  if (current.trim()) statements.push(current.trim());

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        // Check if it's a "relation already exists" or "duplicate" error
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`[SKIP] Statement ${i + 1}: ${preview}...`);
          skipped++;
        } else {
          console.error(`[FAIL] Statement ${i + 1}: ${preview}...`);
          console.error(`       Error: ${error.message}`);
          failed++;
        }
      } else {
        console.log(`[OK]   Statement ${i + 1}: ${preview}...`);
        success++;
      }
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate key'))) {
        console.log(`[SKIP] Statement ${i + 1}: ${preview}...`);
        skipped++;
      } else {
        console.error(`[FAIL] Statement ${i + 1}: ${preview}...`);
        console.error(`       Error: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`  Success: ${success}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Total:   ${statements.length}`);
}

runMigration().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
