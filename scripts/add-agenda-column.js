// Script to add missing agenda column to marketing_activities table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Source scripts/.env.scripts or set env var.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addAgendaColumn() {
  try {
    console.log('Connecting to database...');
    
    // Execute SQL to add the agenda column
    const { data, error } = await supabase.rpc('pg_catalog.pg_stat_user_tables');
    
    if (error) {
      console.error('Error connecting:', error.message);
      return;
    }
    
    console.log('Connected successfully');
    
    // Create a simple function to execute SQL
    const { data: result, error: execError } = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE marketing_activities ADD COLUMN IF NOT EXISTS agenda TEXT;'
    });
    
    if (execError) {
      console.error('Error executing SQL:', execError.message);
      return;
    }
    
    console.log('Successfully added agenda column!');
    console.log('Result:', result);
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

addAgendaColumn();
