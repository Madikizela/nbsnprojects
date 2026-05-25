const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkClasses() {
  try {
    await client.connect();
    
    const result = await client.query('SELECT * FROM "SiteClasses" LIMIT 5');
    console.table(result.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkClasses();
