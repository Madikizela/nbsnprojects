const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function simpleAssignClass() {
  try {
    console.log('🔍 Assigning Class 4 to existing Site 2...\n');
    
    // Update class 4 to use site 2 (which belongs to project 2)
    await pool.query(`
      UPDATE "SiteClasses" 
      SET "SiteId" = 2, "UpdatedAt" = NOW()
      WHERE "Id" = 4
    `);
    
    console.log('✅ Updated Class 4 to use Site 2 (Project 2)');
    
    // Verify the update
    const verifyResult = await pool.query(`
      SELECT sc.*, ps."ProjectId", ps."SiteName", p."ProjectName"
      FROM "SiteClasses" sc
      JOIN "ProjectSites" ps ON sc."SiteId" = ps."Id"
      JOIN "Projects" p ON ps."ProjectId" = p."Id"
      WHERE sc."Id" = 4
    `);
    
    if (verifyResult.rows.length > 0) {
      const result = verifyResult.rows[0];
      console.log(`✅ Class 4 (${result.ClassName}) is now assigned to:`);
      console.log(`   Site: ${result.SiteName}`);
      console.log(`   Project: ${result.ProjectName} (ID: ${result.ProjectId})`);
    }
    
    console.log('\n🎉 Class 4 is now ready for POE testing!');
    
  } catch (error) {
    console.error('❌ Error assigning class:', error);
  } finally {
    await pool.end();
  }
}

simpleAssignClass();