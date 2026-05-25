const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function fixProgressTrackingBug() {
  try {
    console.log('🔧 Fixing Progress Tracking Bug...\n');
    
    const learnerId = 5; // Ntsika Maphango
    
    // 1. Check current state
    console.log('1️⃣ Current state:');
    const currentProgress = await pool.query(`
      SELECT lap.*, lus."unitStandardName"
      FROM "LearnerAssessmentProgress" lap
      JOIN "ProjectQualificationUnitStandards" pqus ON lap."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE lap."LearnerId" = $1
    `, [learnerId]);
    
    currentProgress.rows.forEach(progress => {
      console.log(`  - PQUS ${progress.ProjectQualificationUnitStandardId} (${progress.unitStandardName}): Formative=${progress.FormativeCompleted}, Summative=${progress.SummativeCompleted}`);
    });
    
    // 2. Check what the correct progress should be
    console.log('\n2️⃣ Checking uploaded answers to determine correct progress:');
    const answers = await pool.query(`
      SELECT laa.*, fa."ProjectQualificationUnitStandardId", lus."unitStandardName"
      FROM "LearnerAssessmentAnswers" laa
      JOIN "FormativeAssessments" fa ON laa."AssessmentId" = fa."Id" AND laa."AssessmentType" = 'Formative'
      JOIN "ProjectQualificationUnitStandards" pqus ON fa."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE laa."LearnerId" = $1
    `, [learnerId]);
    
    answers.rows.forEach(answer => {
      console.log(`  - Assessment ${answer.AssessmentId} belongs to PQUS ${answer.ProjectQualificationUnitStandardId} (${answer.unitStandardName})`);
    });
    
    // 3. Delete the wrong progress record (PQUS 5)
    console.log('\n3️⃣ Deleting wrong progress record for PQUS 5...');
    const deleteResult = await pool.query(`
      DELETE FROM "LearnerAssessmentProgress" 
      WHERE "LearnerId" = $1 AND "ProjectQualificationUnitStandardId" = 5
    `, [learnerId]);
    console.log(`  Deleted ${deleteResult.rowCount} wrong progress record(s)`);
    
    // 4. Create the correct progress record for PQUS 4
    console.log('\n4️⃣ Creating correct progress record for PQUS 4...');
    
    // Check if Assessment 5 (formative) is complete
    const assessment5Questions = await pool.query(`
      SELECT COUNT(*) as total_questions
      FROM "FormativeAssessmentQuestions"
      WHERE "FormativeAssessmentId" = 5
    `);
    
    const assessment5Answers = await pool.query(`
      SELECT COUNT(*) as answered_questions
      FROM "LearnerAssessmentAnswers"
      WHERE "LearnerId" = $1 AND "AssessmentId" = 5 AND "AssessmentType" = 'Formative'
    `, [learnerId]);
    
    const totalQuestions = assessment5Questions.rows[0].total_questions;
    const answeredQuestions = assessment5Answers.rows[0].answered_questions;
    const isFormativeComplete = answeredQuestions >= totalQuestions;
    
    console.log(`  Assessment 5: ${answeredQuestions}/${totalQuestions} questions answered (Complete: ${isFormativeComplete})`);
    
    // Insert the correct progress record
    const insertResult = await pool.query(`
      INSERT INTO "LearnerAssessmentProgress" (
        "LearnerId", 
        "ProjectQualificationUnitStandardId", 
        "FormativeAssessmentId",
        "FormativeCompleted",
        "FormativeCompletedAt",
        "SummativeCompleted",
        "CreatedAt",
        "UpdatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
      learnerId, 
      4, // Correct PQUS for Assessment 5
      5, // Assessment 5
      isFormativeComplete,
      isFormativeComplete ? new Date() : null,
      false
    ]);
    
    console.log(`  Created correct progress record for PQUS 4`);
    
    // 5. Verify the fix
    console.log('\n5️⃣ Verifying the fix:');
    const newProgress = await pool.query(`
      SELECT lap.*, lus."unitStandardName"
      FROM "LearnerAssessmentProgress" lap
      JOIN "ProjectQualificationUnitStandards" pqus ON lap."ProjectQualificationUnitStandardId" = pqus."Id"
      JOIN "LegacyUnitStandard" lus ON pqus."UnitStandardId" = lus."id"
      WHERE lap."LearnerId" = $1
    `, [learnerId]);
    
    newProgress.rows.forEach(progress => {
      console.log(`  - PQUS ${progress.ProjectQualificationUnitStandardId} (${progress.unitStandardName}): Formative=${progress.FormativeCompleted}, Summative=${progress.SummativeCompleted}`);
    });
    
    console.log('\n✅ Progress tracking bug fixed successfully!');
    console.log('   - Wrong progress record for PQUS 5 deleted');
    console.log('   - Correct progress record for PQUS 4 created');
    console.log('   - Formative assessment completion status preserved');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixProgressTrackingBug();