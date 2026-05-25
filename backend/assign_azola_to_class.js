const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function assignAzolaToClass() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get Azola's ID
    const userResult = await client.query(`
      SELECT "Id", "FirstName", "LastName"
      FROM "Users"
      WHERE "Email" = 'sthembisomaphango@gmail.com'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const teacherId = userResult.rows[0].Id;
    console.log(`Teacher ID: ${teacherId} (${userResult.rows[0].FirstName} ${userResult.rows[0].LastName})\n`);

    // Get available classes
    console.log('=== Available Classes ===');
    const classesResult = await client.query(`
      SELECT sc."Id", sc."ClassName", ps."SiteName"
      FROM "SiteClasses" sc
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      WHERE sc."Status" = 'Active'
      LIMIT 5
    `);

    if (classesResult.rows.length === 0) {
      console.log('❌ No classes found');
      return;
    }

    console.table(classesResult.rows);

    // Assign to first class
    const classId = classesResult.rows[0].Id;
    console.log(`\n=== Assigning teacher to class ${classId} ===`);

    // Check if already assigned
    const existingResult = await client.query(`
      SELECT * FROM "ClassTeachers"
      WHERE "TeacherId" = $1 AND "ClassId" = $2 AND "IsActive" = true
    `, [teacherId, classId]);

    if (existingResult.rows.length > 0) {
      console.log('✅ Teacher already assigned to this class');
    } else {
      await client.query(`
        INSERT INTO "ClassTeachers" ("ClassId", "TeacherId", "AssignedDate", "IsActive", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, NOW(), true, NOW(), NOW())
      `, [classId, teacherId]);

      console.log('✅ Teacher assigned successfully!');
    }

    // Show all assignments
    console.log('\n=== Teacher Assignments ===');
    const assignmentsResult = await client.query(`
      SELECT ct.*, sc."ClassName", ps."SiteName"
      FROM "ClassTeachers" ct
      JOIN "SiteClasses" sc ON ct."ClassId" = sc."Id"
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      WHERE ct."TeacherId" = $1 AND ct."IsActive" = true
    `, [teacherId]);

    console.table(assignmentsResult.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

assignAzolaToClass();
