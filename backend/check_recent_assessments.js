const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkRecentAssessments() {
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Check recent formative assessments
    console.log('=== Recent Formative Assessments ===');
    const formative = await client.query(`
      SELECT * FROM "FormativeAssessments" 
      ORDER BY "CreatedAt" DESC 
      LIMIT 5
    `);
    console.log(`Found ${formative.rows.length} formative assessments:`);
    formative.rows.forEach(row => {
      console.log(`  ID: ${row.Id}, Date: ${row.AssessmentDate}, Score: ${row.Score}`);
    });
    
    // Check formative questions
    if (formative.rows.length > 0) {
      console.log('\n=== Formative Assessment Questions ===');
      const formativeQuestions = await client.query(`
        SELECT * FROM "FormativeAssessmentQuestions" 
        WHERE "FormativeAssessmentId" = $1
        ORDER BY "QuestionNumber"
      `, [formative.rows[0].Id]);
      console.log(`Found ${formativeQuestions.rows.length} questions for assessment ${formative.rows[0].Id}:`);
      formativeQuestions.rows.forEach(q => {
        console.log(`  Q${q.QuestionNumber}: ${q.QuestionText.substring(0, 50)}... (${q.AllocatedMarks} marks)`);
      });
    }
    
    // Check recent summative assessments
    console.log('\n=== Recent Summative Assessments ===');
    const summative = await client.query(`
      SELECT * FROM "SummativeAssessments" 
      ORDER BY "CreatedAt" DESC 
      LIMIT 5
    `);
    console.log(`Found ${summative.rows.length} summative assessments:`);
    summative.rows.forEach(row => {
      console.log(`  ID: ${row.Id}, Date: ${row.AssessmentDate}, Score: ${row.FinalScore}`);
    });
    
    // Check summative questions
    if (summative.rows.length > 0) {
      console.log('\n=== Summative Assessment Questions ===');
      const summativeQuestions = await client.query(`
        SELECT * FROM "SummativeAssessmentQuestions" 
        WHERE "SummativeAssessmentId" = $1
        ORDER BY "QuestionNumber"
      `, [summative.rows[0].Id]);
      console.log(`Found ${summativeQuestions.rows.length} questions for assessment ${summative.rows[0].Id}:`);
      summativeQuestions.rows.forEach(q => {
        console.log(`  Q${q.QuestionNumber}: ${q.QuestionText.substring(0, 50)}... (${q.AllocatedMarks} marks)`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRecentAssessments();
