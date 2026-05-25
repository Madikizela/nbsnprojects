const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function main() {
  const projects = await pool.query(
    'SELECT "Id", "ProjectName" FROM "Projects" ORDER BY "Id"'
  );
  console.log('Projects:', projects.rows);

  const uploadsByProject = await pool.query(`
    SELECT
      p."Id" as "ProjectId",
      p."ProjectName",
      COUNT(*)::int as "UploadCount"
    FROM "LearnerAssessmentAnswers" a
    LEFT JOIN "FormativeAssessments" fa
      ON fa."Id" = a."AssessmentId"
     AND lower(a."AssessmentType") = 'formative'
    LEFT JOIN "SummativeAssessments" sa
      ON sa."Id" = a."AssessmentId"
     AND lower(a."AssessmentType") = 'summative'
    JOIN "ProjectQualificationUnitStandards" pqus
      ON pqus."Id" = COALESCE(fa."ProjectQualificationUnitStandardId", sa."ProjectQualificationUnitStandardId")
    JOIN "ProjectQualifications" pq
      ON pq."Id" = pqus."ProjectQualificationId"
    JOIN "ProjectLearningPathways" plp
      ON plp."Id" = pq."ProjectLearningPathwayId"
    JOIN "Projects" p
      ON p."Id" = plp."ProjectId"
    GROUP BY p."Id", p."ProjectName"
    ORDER BY "UploadCount" DESC, p."Id" ASC
  `);

  console.log('Uploads by project:', uploadsByProject.rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

