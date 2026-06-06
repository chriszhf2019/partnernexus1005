// Script to add missing agenda column to marketing_activities table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ezkbjufluczpxdixplxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM5MDA5NCwiZXhwIjoyMDk0OTY2MDk0fQ.oPeUBuyHl2Zh-9ueOO7yCWHKG0oAxgdzjYGIUgzVw7E';

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
