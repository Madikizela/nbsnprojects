const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkAssessmentMapping() {
  try {
    console.log('🔍 Checking Assessment to Unit Standard Mapping...\n');
    
    // Get the mapping between assessments and unit standards
    console.log('📋 Formative Assessments Mapping:');
    const formativeResult = await pool.query(`
      SELECT fa."Id" as assessment_id, fa."ProjectQualificationUnitStandardId" as pqus_id,
             pqus."UnitStandardId", lus."unitStandardName"
      FROM "FormativeAssessments" fa
      JOIN "ProjectQualificationUnitStandards" pqus ON fa."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE fa."ProjectQualificationUnitStandardId" IN (4, 5, 6)
      ORDER BY pqus."UnitStandardId"
    `);
    
    formativeResult.rows.forEach(row => {
      console.log(`  Assessment ${row.assessment_id} → PQUS ${row.pqus_id} → Unit Standard ${row.UnitStandardId} (${row.unitStandardName})`);
    });
    
    console.log('\n📋 Summative Assessments Mapping:');
    const summativeResult = await pool.query(`
      SELECT sa."Id" as assessment_id, sa."ProjectQualificationUnitStandardId" as pqus_id,
             pqus."UnitStandardId", lus."unitStandardName"
      FROM "SummativeAssessments" sa
      JOIN "ProjectQualificationUnitStandards" pqus ON sa."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE sa."ProjectQualificationUnitStandardId" IN (4, 5, 6)
      ORDER BY pqus."UnitStandardId"
    `);
    
    summativeResult.rows.forEach(row => {
      console.log(`  Assessment ${row.assessment_id} → PQUS ${row.pqus_id} → Unit Standard ${row.UnitStandardId} (${row.unitStandardName})`);
    });
    
    // Check current learner progress
    console.log('\n📊 Current Learner Progress (Learner 5):');
    const progressResult = await pool.query(`
      SELECT lap.*, lus."unitStandardName"
      FROM "LearnerAssessmentProgress" lap
      JOIN "ProjectQualificationUnitStandards" pqus ON lap."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE lap."LearnerId" = 5
      ORDER BY pqus."UnitStandardId"
    `);
    
    progressResult.rows.forEach(progress => {
      console.log(`  PQUS ${progress.ProjectQualificationUnitStandardId} (${progress.unitStandardName}): Formative=${progress.FormativeCompleted}, Summative=${progress.SummativeCompleted}`);
    });
    
    // Check uploaded answers
    console.log('\n📄 Uploaded Answers (Learner 5):');
    const answersResult = await pool.query(`
      SELECT laa.*, lus."unitStandardName"
      FROM "LearnerAssessmentAnswers" laa
      JOIN "FormativeAssessments" fa ON laa."AssessmentId" = fa."Id" AND laa."AssessmentType" = 'Formative'
      JOIN "ProjectQualificationUnitStandards" pqus ON fa."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE laa."LearnerId" = 5
      ORDER BY pqus."UnitStandardId", laa."QuestionNumber"
    `);
    
    answersResult.rows.forEach(answer => {
      console.log(`  Assessment ${answer.AssessmentId} (${answer.AssessmentType}), Question ${answer.QuestionNumber}: ${answer.unitStandardName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAssessmentMapping();