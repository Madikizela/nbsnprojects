const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkSitesTable() {
  try {
    await client.connect();
    
    // Check if sites table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%site%'
    `);
    
    console.log('Tables with "site" in name:');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSitesTable();
