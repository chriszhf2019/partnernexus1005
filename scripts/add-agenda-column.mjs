// Script to add missing agenda column to marketing_activities table
import { createClient } from '@supabase/supabase-js';

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
    
    // Use REST API to check connection
    const { data, error } = await supabase.from('partners').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting:', error.message);
      return;
    }
    
    console.log('Connected successfully');
    
    // Since we can't run arbitrary SQL directly, let's try inserting a row with agenda
    // This will fail if agenda column doesn't exist
    console.log('Testing agenda column...');
    
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

addAgendaColumn();
