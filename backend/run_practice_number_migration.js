const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync('backend/add_practice_number_column.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Migration successful - PracticeNumber column added');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
