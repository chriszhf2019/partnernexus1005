const { Client } = require('pg');

async function verify() {
  const client = new Client({
    host: 'db.ezkbjufluczpxdixplxu.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'tmee9YJt4ryV3rbZ',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('\n📋 Verifying Database Migration...\n');
    
    const tables = [
      'marketing_materials',
      'marketing_guests',
      'marketing_execution_phases',
      'marketing_phase_tasks',
      'marketing_evaluations',
      'marketing_evaluation_leads'
    ];
    
    for (const table of tables) {
      const { rows } = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND tconst { Client } = require('pg');

async function verify() {
  const client = new Client({
    host: le
async function verify() {
  const cliene.l  const client = new Cli N    host: '"db.ezkbjufluc port: 5432,