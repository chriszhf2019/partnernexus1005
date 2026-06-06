// Script to add missing agenda column to marketing_activities table
import { createClient } from '@supabase/supabase-js';

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
