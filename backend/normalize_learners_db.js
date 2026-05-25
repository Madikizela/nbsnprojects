const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function normalizeLearners() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('./normalize_learners_structure.sql', 'utf8');
    
    await client.query(sql);
    console.log('✅ Database normalized successfully');
    console.log('   - Learners table recreated');
    console.log('   - ClassEnrollments table created');
    console.log('   - Indexes created');

  } catch (error) {
    console.error('❌ Error normalizing database:', error.message);
  } finally {
    await client.end();
  }
}

normalizeLearners();
