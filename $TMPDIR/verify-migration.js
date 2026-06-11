const fs = require('fs');
const sql = fs.readFileSync('/Volumes/z/101/partner-management-1-main/supabase/migrations/20250618000020_db_optimization.sql', 'utf-8');

const statements = sql.split(';').filter(s => s.trim().length > 0);
console.log('Total SQL blocks:', statements.length);

const creates = sql.match(/CREATE INDEX IF NOT EXISTS/g);
console.log('New indexes created:', creates ? creates.length : 0);

const drops = sql.match(/DROP INDEX IF EXISTS/g);
console.log('Old indexes dropped:', drops ? drops.length : 0);

console.log('Has trigger function:', sql.includes('CREATE OR REPLACE FUNCTION update_updated_at_column()'));
console.log('Has trigger DO block:', sql.includes('CREATE TRIGGER trg_'));

// List all tables receiving triggers
const triggerTables = sql.match(/'([a-z_]+)'/g);
// Remove DO block var names
const uniqueTables = [...new Set(triggerTables.filter(t => t !== "'tbl'"))];
console.log('Tables receiving triggers:', uniqueTables.length);

// Output the full SQL for verification
console.log('\n=== FULL MIGRATION SQL ===\n');
console.log(sql);
