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
    
    // Drop existing table if it exists
    console.log('Dropping existing SummativeAssessmentQuestions table if exists...');
    await client.query('DROP TABLE IF EXISTS "SummativeAssessmentQuestions" CASCADE');
    console.log('✓ Table dropped (if existed)');
    
    // Create with correct structure
    console.log('Creating new SummativeAssessmentQuestions table...');
    const sql = fs.readFileSync('create_summative_assessment_questions_table.sql', 'utf8');
    await client.query(sql);
    console.log('✓ Table created successfully');
    
    // Verify structure
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'SummativeAssessmentQuestions' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nNew table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTable();
