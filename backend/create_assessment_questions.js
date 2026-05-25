const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync('create_assessment_questions_table.sql', 'utf8');
    await client.query(sql);
    
    console.log('✓ Assessment questions table created successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTable();
