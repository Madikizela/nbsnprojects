const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkTables() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%AssessmentQuestion%' 
      ORDER BY table_name
    `);
    
    console.log('Tables matching AssessmentQuestion:');
    result.rows.forEach(row => {
      console.log(`  ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
