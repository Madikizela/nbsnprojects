const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkAssessmentTableStructure() {
  try {
    console.log('🔍 Checking Assessment Table Structures...\n');
    
    // Check FormativeAssessments table
    console.log('📋 FormativeAssessments table structure:');
    const formativeColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FormativeAssessments'
      ORDER BY ordinal_position
    `);
    
    formativeColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check SummativeAssessments table
    console.log('\n📋 SummativeAssessments table structure:');
    const summativeColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'SummativeAssessments'
      ORDER BY ordinal_position
    `);
    
    summativeColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check FormativeAssessmentQuestions table
    console.log('\n📋 FormativeAssessmentQuestions table structure:');
    const formativeQColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'FormativeAssessmentQuestions'
      ORDER BY ordinal_position
    `);
    
    formativeQColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check SummativeAssessmentQuestions table
    console.log('\n📋 SummativeAssessmentQuestions table structure:');
    const summativeQColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'SummativeAssessmentQuestions'
      ORDER BY ordinal_position
    `);
    
    summativeQColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await pool.end();
  }
}

checkAssessmentTableStructure();