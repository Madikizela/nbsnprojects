const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkQADataSimple() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Get overall counts
    console.log('\n=== QA OVERVIEW METRICS ===');
    
    // Total qualifications in system
    const totalQualQuery = `
      SELECT 
        (SELECT COUNT(*) FROM legacy_qualifications) + 
        (SELECT COUNT(*) FROM occupational_qualifications) as total_qualifications;
    `;
    const totalQualResult = await client.query(totalQualQuery);
    console.log(`Total Qualifications in System: ${totalQualResult.rows[0].total_qualifications}`);

    // Total unit standards in system
    const totalUSQuery = `
      SELECT 
        (SELECT COUNT(*) FROM legacy_unit_standards) + 
        (SELECT COUNT(*) FROM occupational_unit_standards) as total_unit_standards;
    `;
    const totalUSResult = await client.query(totalUSQuery);
    console.log(`Total Unit Standards in System: ${totalUSResult.rows[0].total_unit_standards}`);

    // Assessment questions
    const assessmentQuestionsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "FormativeAssessmentQuestions") as formative_questions,
        (SELECT COUNT(*) FROM "SummativeAssessmentQuestions") as summative_questions;
    `;
    const assessmentQuestionsResult = await client.query(assessmentQuestionsQuery);
    const formativeQuestions = assessmentQuestionsResult.rows[0].formative_questions;
    const summativeQuestions = assessmentQuestionsResult.rows[0].summative_questions;
    console.log(`Formative Assessment Questions: ${formativeQuestions}`);
    console.log(`Summative Assessment Questions: ${summativeQuestions}`);
    console.log(`Total Assessment Questions: ${parseInt(formativeQuestions) + parseInt(summativeQuestions)}`);

    // Active projects with qualifications
    const activeProjectsQuery = `
      SELECT COUNT(DISTINCT p."Id") as active_projects_with_qualifications
      FROM "Projects" p
      INNER JOIN "ProjectLearningPathways" plp ON p."Id" = plp."ProjectId"
      INNER JOIN "ProjectQualifications" pq ON plp."Id" = pq."ProjectLearningPathwayId";
    `;
    const activeProjectsResult = await client.query(activeProjectsQuery);
    console.log(`Active Projects with Qualifications: ${activeProjectsResult.rows[0].active_projects_with_qualifications}`);

    // Project qualifications and unit standards
    const projectDataQuery = `
      SELECT 
        COUNT(DISTINCT pq."Id") as project_qualifications,
        COUNT(DISTINCT pqus."Id") as project_unit_standards
      FROM "ProjectQualifications" pq
      LEFT JOIN "ProjectQualificationUnitStandards" pqus ON pq."Id" = pqus."ProjectQualificationId";
    `;
    const projectDataResult = await client.query(projectDataQuery);
    console.log(`Project Qualifications: ${projectDataResult.rows[0].project_qualifications}`);
    console.log(`Project Unit Standards: ${projectDataResult.rows[0].project_unit_standards}`);

    // Assessment counts
    const assessmentCountsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "FormativeAssessments") as formative_assessments,
        (SELECT COUNT(*) FROM "SummativeAssessments") as summative_assessments;
    `;
    const assessmentCountsResult = await client.query(assessmentCountsQuery);
    const formativeAssessments = assessmentCountsResult.rows[0].formative_assessments;
    const summativeAssessments = assessmentCountsResult.rows[0].summative_assessments;
    console.log(`Formative Assessments: ${formativeAssessments}`);
    console.log(`Summative Assessments: ${summativeAssessments}`);
    console.log(`Total Assessments: ${parseInt(formativeAssessments) + parseInt(summativeAssessments)}`);

  } catch (error) {
    console.error('Error checking QA data:', error);
  } finally {
    await client.end();
  }
}

checkQADataSimple();