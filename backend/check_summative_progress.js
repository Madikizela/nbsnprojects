const { Pool } = require('pg');
const pool = new Pool({host:'localhost',port:5432,database:'nbsnproject',user:'postgres',password:'12345'});

async function run() {
  // Check distinct uploaded question IDs for learner 1, summative assessment 1
  const uploads = await pool.query(
    `SELECT DISTINCT "QuestionId" FROM "LearnerAssessmentAnswers" 
     WHERE "LearnerId"=1 AND "AssessmentId"=1 AND "AssessmentType"='Summative' AND "IsRemedial"=false`
  );
  console.log('Distinct uploaded QuestionIds:', uploads.rows.map(r => r.QuestionId));
  console.log('Total distinct uploaded:', uploads.rows.length);

  // Check total questions for summative assessment 1
  const questions = await pool.query(
    `SELECT COUNT(*) as total FROM "SummativeAssessmentQuestions" WHERE "SummativeAssessmentId"=1`
  );
  console.log('Total summative questions:', questions.rows[0].total);

  // Check current progress record
  const progress = await pool.query(
    `SELECT * FROM "LearnerAssessmentProgress" WHERE "LearnerId"=1 AND "ProjectQualificationUnitStandardId"=1`
  );
  console.log('Progress record:', JSON.stringify(progress.rows[0], null, 2));

  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
