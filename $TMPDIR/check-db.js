const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ezkbjufluczpxdixplxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6a2JqdWZsdWN6cHhkaXhwbHh1Iiwicm9zZSI6ImFub24iLCJpYXQiOjE3NzkzOTAwOTQsImV4cCI6MjA5NDk2NjA5NH0.r_uQ3zagzrwixTNL-nt04uzEWfae333_rUViNyiwNJw'
);

async function run() {
  // Test connection
  console.log('Testing Supabase connection...');
  const { data, error } = await supabase.from('partners').select('count').limit(1);
  if (error) {
    console.log('Connection failed:', error.message);
    return;
  }
  console.log('Connected!');

  // Check existing indexes on deals
  console.log('Checking existing indexes on deals...');
  const { data: indexes, error: idxErr } = await supabase
    .from('deals')
    .select('stage')
    .limit(1);
  if (idxErr) {
    console.log('Deals query error:', idxErr.message);
  } else {
    console.log('Deals table accessible, sample stage:', data);
  }

  // Try to run the migration via pg connection
  console.log('Need direct pg connection to run migration.');
  console.log('Supabase URL:', 'https://ezkbjufluczpxdixplxu.supabase.co');
}
run().catch(console.error);
