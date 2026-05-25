const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkQAData() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check qualifications
    console.log('\n=== QUALIFICATIONS SUMMARY ===');
    
    // Legacy qualifications
    const legacyQualQuery = `
      SELECT COUNT(*) as count FROM legacy_qualifications;
    `;
    const legacyQualResult = await client.query(legacyQualQuery);
    console.log(`Legacy Qualifications: ${legacyQualResult.rows[0].count}`);

    // Occupational qualifications
    const occQualQuery = `
      SELECT COUNT(*) as count FROM occupational_qualifications;
    `;
    const occQualResult = await client.query(occQualQuery);
    console.log(`Occupational Qualifications: ${occQualResult.rows[0].count}`);

    // Check unit standards
    console.log('\n=== UNIT STANDARDS SUMMARY ===');
    
    // Legacy unit standards
    const legacyUSQuery = `
      SELECT COUNT(*) as count FROM legacy_unit_standards;
    `;
    const legacyUSResult = await client.query(legacyUSQuery);
    console.log(`Legacy Unit Standards: ${legacyUSResult.rows[0].count}`);

    // Occupational unit standards
    const occUSQuery = `
      SELECT COUNT(*) as count FROM occupational_unit_standards;
    `;
    const occUSResult = await client.query(occUSQuery);
    console.log(`Occupational Unit Standards: ${occUSResult.rows[0].count}`);

    // Check assessment questions
    console.log('\n=== ASSESSMENT QUESTIONS SUMMARY ===');
    
    // Formative assessment questions
    const formativeQQuery = `
      SELECT COUNT(*) as count FROM "FormativeAssessmentQuestions";
    `;
    const formativeQResult = await client.query(formativeQQuery);
    console.log(`Formative Assessment Questions: ${formativeQResult.rows[0].count}`);

    // Summative assessment questions
    const summativeQQuery = `
      SELECT COUNT(*) as count FROM "SummativeAssessmentQuestions";
    `;
    const summativeQResult = await client.query(summativeQQuery);
    console.log(`Summative Assessment Questions: ${summativeQResult.rows[0].count}`);

    // Check assessments
    console.log('\n=== ASSESSMENTS SUMMARY ===');
    
    // Formative assessments
    const formativeAQuery = `
      SELECT COUNT(*) as count FROM "FormativeAssessments";
    `;
    const formativeAResult = await client.query(formativeAQuery);
    console.log(`Formative Assessments: ${formativeAResult.rows[0].count}`);

    // Summative assessments
    const summativeAQuery = `
      SELECT COUNT(*) as count FROM "SummativeAssessments";
    `;
    const summativeAResult = await client.query(summativeAQuery);
    console.log(`Summative Assessments: ${summativeAResult.rows[0].count}`);

    // Check project qualifications and unit standards
    console.log('\n=== PROJECT QUALIFICATIONS & UNIT STANDARDS ===');
    
    const projectQualQuery = `
      SELECT COUNT(*) as count FROM "ProjectQualifications";
    `;
    const projectQualResult = await client.query(projectQualQuery);
    console.log(`Project Qualifications: ${projectQualResult.rows[0].count}`);

    const projectUSQuery = `
      SELECT COUNT(*) as count FROM "ProjectQualificationUnitStandards";
    `;
    const projectUSResult = await client.query(projectUSQuery);
    console.log(`Project Unit Standards: ${projectUSResult.rows[0].count}`);

    // Get detailed breakdown by project
    console.log('\n=== DETAILED PROJECT BREAKDOWN ===');
    
    const projectBreakdownQuery = `
      SELECT 
        p."ProjectName",
        COUNT(DISTINCT pq."Id") as qualifications_count,
        COUNT(DISTINCT pqus."Id") as unit_standards_count,
        COUNT(DISTINCT fa."Id") as formative_assessments,
        COUNT(DISTINCT sa."Id") as summative_assessments,
        COUNT(DISTINCT faq."Id") as formative_questions,
        COUNT(DISTINCT saq."Id") as summative_questions
      FROM "Projects" p
      LEFT JOIN "ProjectLearningPathways" plp ON p."Id" = plp."ProjectId"
      LEFT JOIN "ProjectQualifications" pq ON plp."Id" = pq."ProjectLearningPathwayId"
      LEFT JOIN "ProjectQualificationUnitStandards" pqus ON pq."Id" = pqus."ProjectQualificationId"
      LEFT JOIN "FormativeAssessments" fa ON pqus."UnitStandardId" = fa."UnitStandardId"
      LEFT JOIN "SummativeAssessments" sa ON pqus."UnitStandardId" = sa."UnitStandardId"
      LEFT JOIN "FormativeAssessmentQuestions" faq ON fa."Id" = faq."FormativeAssessmentId"
      LEFT JOIN "SummativeAssessmentQuestions" saq ON sa."Id" = saq."SummativeAssessmentId"
      GROUP BY p."Id", p."ProjectName"
      ORDER BY p."ProjectName";
    `;
    
    const projectBreakdownResult = await client.query(projectBreakdownQuery);
    
    projectBreakdownResult.rows.forEach(row => {
      console.log(`\n📁 ${row.ProjectName}:`);
      console.log(`   Qualifications: ${row.qualifications_count}`);
      console.log(`   Unit Standards: ${row.unit_standards_count}`);
      console.log(`   Formative Assessments: ${row.formative_assessments}`);
      console.log(`   Summative Assessments: ${row.summative_assessments}`);
      console.log(`   Formative Questions: ${row.formative_questions}`);
      console.log(`   Summative Questions: ${row.summative_questions}`);
    });

  } catch (error) {
    console.error('Error checking QA data:', error);
  } finally {
    await client.end();
  }
}

checkQAData();