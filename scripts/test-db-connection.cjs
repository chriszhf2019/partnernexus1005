const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

async function main() {
  try {
    await client.connect();
    console.log('connected');
    const r = await client.query("SELECT 1 AS x");
    console.log('query ok:', r.rows[0]);

    const tables = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE tablename LIKE 'marketing%'
      ORDER BY tablename
    `);
    console.log('tables:', tables.rows);

    const cols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'marketing_activities'
      ORDER BY ordinal_position
    `);
    console.log('marketing_activities columns:', cols.rows.map(r => r.column_name).join(', '));
    await client.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('STACK:', e.stack);
    process.exit(1);
  }
}

main();
