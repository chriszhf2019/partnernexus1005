/**
 * Execute Incentive Policy Optimization Migration
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function executeMigration() {
  console.log('Reading migration file...');
  const sql = fs.readFileSync('supabase/migrations/20250608000011_incentive_policy_optimization.sql', 'utf-8');
  
  console.log('Executing migration...');
  
  // Split SQL into individual statements and execute them
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) continue;
    
    console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
    
    try {
      // Use raw SQL execution via RPC
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: trimmedStatement + ';' });
      
      if (error) {
        // Try direct table operations for CREATE TABLE statements
        if (trimmedStatement.includes('CREATE TABLE')) {
          console.log('Note: CREATE TABLE needs to be executed via Supabase Dashboard or psql');
        } else {
          console.error('Error:', error.message);
        }
      } else {
        console.log('✓ Success');
      }
    } catch (err) {
      console.error('Error executing statement:', err);
    }
  }
  
  console.log('\nMigration execution completed!');
  console.log('\nNote: Some statements may need to be executed manually via Supabase Dashboard SQL Editor:');
  console.log('https://supabase.com/dashboard/project/ezkbjufluczpxdixplxu/sql');
}

executeMigration().catch(console.error);