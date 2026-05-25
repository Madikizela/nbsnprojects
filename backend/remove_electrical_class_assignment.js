const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function removeElectricalClassAssignment() {
  try {
    await client.connect();
    console.log('Connected to database');

    // First, let's see Azola's current assignments
    console.log('\n=== Current Assignments for Azola (User ID 53) ===');
    const currentAssignments = await client.query(`
      SELECT 
        ct."Id",
        ct."ClassId",
        ct."TeacherId",
        ct."IsActive",
        sc."ClassName",
        ps."SiteName"
      FROM "ClassTeachers" ct
      JOIN "SiteClasses" sc ON ct."ClassId" = sc."Id"
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      WHERE ct."TeacherId" = 53
      ORDER BY ct."Id"
    `);
    
    console.table(currentAssignments.rows);

    // Find the Electrical Class B assignment
    const electricalClass = currentAssignments.rows.find(row => 
      row.ClassName.includes('Electrical') && row.ClassName.includes('Class B')
    );

    if (!electricalClass) {
      console.log('\n❌ Electrical Class B assignment not found');
      return;
    }

    console.log(`\n🎯 Found Electrical Class B assignment (ID: ${electricalClass.Id})`);
    console.log(`   Class: ${electricalClass.ClassName}`);
    console.log(`   Site: ${electricalClass.SiteName}`);

    // Remove the assignment by setting IsActive to false
    await client.query(`
      UPDATE "ClassTeachers"
      SET "IsActive" = false,
          "UpdatedAt" = NOW()
      WHERE "Id" = $1
    `, [electricalClass.Id]);

    console.log('\n✅ Assignment removed successfully');

    // Show remaining assignments
    console.log('\n=== Remaining Active Assignments ===');
    const remainingAssignments = await client.query(`
      SELECT 
        ct."Id",
        ct."ClassId",
        sc."ClassName",
        ps."SiteName",
        ct."AssignedDate"
      FROM "ClassTeachers" ct
      JOIN "SiteClasses" sc ON ct."ClassId" = sc."Id"
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      WHERE ct."TeacherId" = 53 AND ct."IsActive" = true
      ORDER BY ct."Id"
    `);
    
    console.table(remainingAssignments.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

removeElectricalClassAssignment();
