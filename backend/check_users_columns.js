const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkColumns() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    result.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkColumns();
