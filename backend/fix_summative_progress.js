const { Pool } = require('pg');
const pool = new Pool({host:'localhost',port:5432,database:'nbsnproject',user:'postgres',password:'12345'});

async function run() {
  // Fix all progress records where uploads exist but SummativeCompleted is false
  const result = await pool.query(`
    UPDATE "LearnerAssessmentProgress" lap
    SET "SummativeCompleted" = true,
        "SummativeCompletedAt" = NOW(),
        "UpdatedAt" = NOW()
    WHERE lap."SummativeAssessmentId" IS NOT NULL
      AND lap."SummativeCompleted" = false
      AND (
        SELECT COUNT(DISTINCT laa."QuestionId")
        FROM "LearnerAssessmentAnswers" laa
        WHERE laa."LearnerId" = lap."LearnerId"
          AND laa."AssessmentId" = lap."SummativeAssessmentId"
          AND laa."AssessmentType" = 'Summative'
          AND laa."IsRemedial" = false
      ) >= (
        SELECT COUNT(*) FROM "SummativeAssessmentQuestions" saq
        WHERE saq."SummativeAssessmentId" = lap."SummativeAssessmentId"
      )
      AND (
        SELECT COUNT(*) FROM "SummativeAssessmentQuestions" saq
        WHERE saq."SummativeAssessmentId" = lap."SummativeAssessmentId"
      ) > 0
    RETURNING "Id", "LearnerId", "ProjectQualificationUnitStandardId", "SummativeCompleted"
  `);
  
  console.log(`Fixed ${result.rowCount} progress records:`);
  result.rows.forEach(r => console.log(`  Progress ID ${r.Id}: Learner ${r.LearnerId}, US ${r.ProjectQualificationUnitStandardId} -> SummativeCompleted=true`));
  
  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
