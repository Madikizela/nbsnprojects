const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createLearnersTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('./create_learners_table.sql', 'utf8');
    
    await client.query(sql);
    console.log('✅ Learners table created successfully');

  } catch (error) {
    console.error('❌ Error creating learners table:', error.message);
  } finally {
    await client.end();
  }
}

createLearnersTable();
