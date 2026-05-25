const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function setupAzolaTeacher() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Find Azola by email
    console.log('=== Finding Azola Maphango ===');
    const userResult = await client.query(`
      SELECT "Id", "FirstName", "LastName", "Email", "Role"
      FROM "Users"
      WHERE "Email" = 'azolamaphango@gmail.com'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found with email: azolamaphango@gmail.com');
      return;
    }

    const user = userResult.rows[0];
    console.log('User found:');
    console.table([user]);

    // Update role to Teacher (16)
    console.log('\n=== Updating role to Teacher (16) ===');
    await client.query(`
      UPDATE "Users"
      SET "Role" = 16
      WHERE "Id" = $1
    `, [user.Id]);

    console.log('✅ Role updated successfully!');

    // Get available classes
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

    console.log('\n=== Available Classes ===');
    console.table(classesResult.rows);

    // Assign to first class
    const classId = classesResult.rows[0].Id;
    console.log(`\n=== Assigning teacher to class ${classId} ===`);

    // Check if already assigned
    const existingResult = await client.query(`
      SELECT * FROM "ClassTeachers"
      WHERE "TeacherId" = $1 AND "ClassId" = $2 AND "IsActive" = true
    `, [user.Id, classId]);

    if (existingResult.rows.length > 0) {
      console.log('✅ Teacher already assigned to this class');
    } else {
      await client.query(`
        INSERT INTO "ClassTeachers" ("ClassId", "TeacherId", "AssignedDate", "IsActive", "CreatedAt", "UpdatedAt")
        VALUES ($1, $2, NOW(), true, NOW(), NOW())
      `, [classId, user.Id]);

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
    `, [user.Id]);

    console.table(assignmentsResult.rows);

    console.log('\n✅ Setup complete!');
    console.log('\nLogin credentials:');
    console.log('Email: azolamaphango@gmail.com');
    console.log('Password: M5Jq@mqRMLFP');
    console.log('\nNow restart the backend and test the login!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

setupAzolaTeacher();
