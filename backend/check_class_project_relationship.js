const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkClassProjectRelationship() {
  try {
    console.log('🔍 Checking Class-Project relationship for Class 4...\n');
    
    // Check class 4 details
    const classResult = await pool.query('SELECT * FROM "SiteClasses" WHERE "Id" = 4');
    if (classResult.rows.length > 0) {
      const classInfo = classResult.rows[0];
      console.log('📚 Class 4 Details:');
      console.log(`  - Class Name: ${classInfo.ClassName}`);
      console.log(`  - Site ID: ${classInfo.SiteId}`);
      console.log(`  - Max Learners: ${classInfo.MaxLearners}`);
      
      // Get site details
      const siteResult = await pool.query('SELECT * FROM "ProjectSites" WHERE "Id" = $1', [classInfo.SiteId]);
      if (siteResult.rows.length > 0) {
        const siteInfo = siteResult.rows[0];
        console.log('\n🏢 Site Details:');
        console.log(`  - Site Name: ${siteInfo.SiteName}`);
        console.log(`  - Project ID: ${siteInfo.ProjectId}`);
        
        // Get project details
        const projectResult = await pool.query('SELECT * FROM "Projects" WHERE "Id" = $1', [siteInfo.ProjectId]);
        if (projectResult.rows.length > 0) {
          const projectInfo = projectResult.rows[0];
          console.log('\n🎯 Project Details:');
          console.log(`  - Project Name: ${projectInfo.ProjectName}`);
          console.log(`  - Project ID: ${projectInfo.Id}`);
          
          // Check project qualifications
          const qualificationsResult = await pool.query(`
            SELECT pq.*, qt."Name" as QualificationTypeName
            FROM "ProjectQualifications" pq
            LEFT JOIN "QualificationTypes" qt ON pq."QualificationTypeId" = qt."Id"
            WHERE pq."ProjectId" = $1
          `, [projectInfo.Id]);
          
          console.log(`\n📋 Project Qualifications (${qualificationsResult.rows.length} found):`);
          qualificationsResult.rows.forEach(qual => {
            console.log(`  - ID: ${qual.Id}, Type: ${qual.QualificationTypeName}`);
            console.log(`    Occupational ID: ${qual.OccupationalQualificationId}`);
            console.log(`    Legacy ID: ${qual.LegacyQualificationId}`);
          });
          
          // Check if there are assessments for this project
          const assessmentsResult = await pool.query(`
            SELECT fa.*, pqus."ProjectQualificationId"
            FROM "FormativeAssessments" fa
            JOIN "ProjectQualificationUnitStandards" pqus ON fa."UnitStandardId" = pqus."UnitStandardId"
            WHERE pqus."ProjectQualificationId" IN (
              SELECT "Id" FROM "ProjectQualifications" WHERE "ProjectId" = $1
            )
            LIMIT 5
          `, [projectInfo.Id]);
          
          console.log(`\n📝 Formative Assessments for Project (${assessmentsResult.rows.length} found):`);
          assessmentsResult.rows.forEach(assessment => {
            console.log(`  - ID: ${assessment.Id}, Title: ${assessment.Title}`);
            console.log(`    Unit Standard ID: ${assessment.UnitStandardId}`);
          });
        }
      }
    } else {
      console.log('❌ Class 4 not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking class-project relationship:', error);
  } finally {
    await pool.end();
  }
}

checkClassProjectRelationship();