const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkAllClassesProjects() {
  try {
    console.log('🔍 Checking all Classes and their Project relationships...\n');
    
    // Get all classes
    const classesResult = await pool.query('SELECT * FROM "SiteClasses" ORDER BY "Id"');
    console.log(`📚 Found ${classesResult.rows.length} classes:`);
    
    for (const classInfo of classesResult.rows) {
      console.log(`\n--- Class ${classInfo.Id}: ${classInfo.ClassName} ---`);
      console.log(`  Site ID: ${classInfo.SiteId || 'NULL'}`);
      console.log(`  Max Learners: ${classInfo.MaxLearners}`);
      
      if (classInfo.SiteId) {
        // Get site details
        const siteResult = await pool.query('SELECT * FROM "ProjectSites" WHERE "Id" = $1', [classInfo.SiteId]);
        if (siteResult.rows.length > 0) {
          const siteInfo = siteResult.rows[0];
          console.log(`  Site Name: ${siteInfo.SiteName}`);
          console.log(`  Project ID: ${siteInfo.ProjectId}`);
          
          // Get project details
          const projectResult = await pool.query('SELECT * FROM "Projects" WHERE "Id" = $1', [siteInfo.ProjectId]);
          if (projectResult.rows.length > 0) {
            const projectInfo = projectResult.rows[0];
            console.log(`  Project: ${projectInfo.ProjectName}`);
            
            // Check project qualifications
            const qualificationsResult = await pool.query(`
              SELECT COUNT(*) as count
              FROM "ProjectQualifications" 
              WHERE "ProjectId" = $1
            `, [projectInfo.Id]);
            
            console.log(`  Qualifications: ${qualificationsResult.rows[0].count}`);
          }
        }
      } else {
        console.log('  ⚠️ No site assigned to this class');
      }
    }
    
    // Check if there's a POE hierarchy endpoint that might work
    console.log('\n🔍 Checking existing POE hierarchy endpoint...');
    console.log('The AssessmentsController has: GET: api/Assessments/poe-hierarchy/class/{classId}');
    
  } catch (error) {
    console.error('❌ Error checking classes and projects:', error);
  } finally {
    await pool.end();
  }
}

checkAllClassesProjects();