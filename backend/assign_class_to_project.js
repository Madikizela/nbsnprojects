const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function assignClassToProject() {
  try {
    console.log('🔍 Finding a project with assessments to assign to Class 4...\n');
    
    // First, let's create a simple project site for testing
    console.log('📚 Creating a test project site...');
    
    // Check if project 1 exists
    const projectResult = await pool.query('SELECT * FROM "Projects" WHERE "Id" = 1');
    if (projectResult.rows.length === 0) {
      console.log('❌ Project 1 not found');
      return;
    }
    
    const project = projectResult.rows[0];
    console.log(`✅ Found project: ${project.ProjectName}`);
    
    // Check if there's already a site for this project
    const existingSiteResult = await pool.query('SELECT * FROM "ProjectSites" WHERE "ProjectId" = 1');
    
    let siteId;
    if (existingSiteResult.rows.length > 0) {
      siteId = existingSiteResult.rows[0].Id;
      console.log(`✅ Using existing site ID: ${siteId}`);
    } else {
      // Create a project site
      const siteResult = await pool.query(`
        INSERT INTO "ProjectSites" ("ProjectId", "SiteName", "SiteAddress", "CreatedAt", "UpdatedAt")
        VALUES (1, 'Test Site for Class 4', 'Test Address', NOW(), NOW())
        RETURNING "Id"
      `);
      siteId = siteResult.rows[0].Id;
      console.log(`✅ Created new site ID: ${siteId}`);
    }
    
    // Update class 4 to use this site
    await pool.query(`
      UPDATE "SiteClasses" 
      SET "SiteId" = $1, "UpdatedAt" = NOW()
      WHERE "Id" = 4
    `, [siteId]);
    
    console.log('✅ Updated Class 4 to use the project site');
    
    // Verify the update
    const verifyResult = await pool.query('SELECT * FROM "SiteClasses" WHERE "Id" = 4');
    const updatedClass = verifyResult.rows[0];
    console.log(`✅ Class 4 now has SiteId: ${updatedClass.SiteId}`);
    
    // Now let's add some basic project qualifications and assessments for testing
    console.log('\n📚 Setting up basic qualifications and assessments...');
    
    // Check if project already has qualifications
    const existingQualResult = await pool.query('SELECT * FROM "ProjectQualifications" WHERE "ProjectId" = 1');
    
    if (existingQualResult.rows.length === 0) {
      console.log('Adding a test qualification...');
      
      // Add a project qualification (using the first occupational qualification)
      const occQualResult = await pool.query('SELECT * FROM occupational_qualifications LIMIT 1');
      if (occQualResult.rows.length > 0) {
        const occQual = occQualResult.rows[0];
        
        const projQualResult = await pool.query(`
          INSERT INTO "ProjectQualifications" 
          ("ProjectId", "OccupationalQualificationId", "EmploymentType", "CreatedAt", "UpdatedAt")
          VALUES (1, $1, 'Full-time', NOW(), NOW())
          RETURNING "Id"
        `, [occQual.qualification_id]);
        
        const projQualId = projQualResult.rows[0].Id;
        console.log(`✅ Created project qualification ID: ${projQualId}`);
        
        // Add a unit standard
        const unitStandardResult = await pool.query('SELECT * FROM occupational_unit_standards WHERE qualification_id = $1 LIMIT 1', [occQual.qualification_id]);
        if (unitStandardResult.rows.length > 0) {
          const unitStandard = unitStandardResult.rows[0];
          
          const pqusResult = await pool.query(`
            INSERT INTO "ProjectQualificationUnitStandards" 
            ("ProjectQualificationId", "UnitStandardId", "UnitStandardType", "CreatedAt", "UpdatedAt")
            VALUES ($1, $2, 'Occupational', NOW(), NOW())
            RETURNING "Id"
          `, [projQualId, unitStandard.unit_standard_id]);
          
          const pqusId = pqusResult.rows[0].Id;
          console.log(`✅ Created project qualification unit standard ID: ${pqusId}`);
          
          // Add a formative assessment
          await pool.query(`
            INSERT INTO "FormativeAssessments" 
            ("ProjectQualificationUnitStandardId", "Title", "Description", "AssessmentMethod", "Status", "CreatedAt", "UpdatedAt")
            VALUES ($1, 'Test Formative Assessment', 'A test assessment for POE', 'Written', 'Active', NOW(), NOW())
          `, [pqusId]);
          
          console.log('✅ Created test formative assessment');
          
          // Add a summative assessment
          await pool.query(`
            INSERT INTO "SummativeAssessments" 
            ("ProjectQualificationUnitStandardId", "Title", "Description", "Status", "CreatedAt", "UpdatedAt")
            VALUES ($1, 'Test Summative Assessment', 'A test summative assessment for POE', 'Active', NOW(), NOW())
          `, [pqusId]);
          
          console.log('✅ Created test summative assessment');
        }
      }
    } else {
      console.log('✅ Project already has qualifications configured');
    }
    
    console.log('\n🎉 Class 4 is now ready for POE testing!');
    
  } catch (error) {
    console.error('❌ Error assigning class to project:', error);
  } finally {
    await pool.end();
  }
}

assignClassToProject();