const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function createAssessmentAnswerTables() {
  try {
    console.log('📝 Creating Learner Assessment Answer Tables...\n');
    
    const sql = fs.readFileSync('create_learner_assessment_answers_table.sql', 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Tables created successfully!');
    console.log('  - LearnerAssessmentAnswers');
    console.log('  - LearnerAssessmentProgress');
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('LearnerAssessmentAnswers', 'LearnerAssessmentProgress')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Verification:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name} table exists`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createAssessmentAnswerTables();