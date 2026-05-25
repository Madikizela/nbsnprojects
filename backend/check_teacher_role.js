const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkTeacherRole() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check Azola Maphango's role
    console.log('=== Checking Azola Maphango ===');
    const userResult = await client.query(`
      SELECT "Id", "Name", "Email", "Role", "Status"
      FROM "Users"
      WHERE "Name" LIKE '%Azola%' OR "Email" LIKE '%azola%'
    `);
    
    if (userResult.rows.length > 0) {
      console.log('User found:');
      console.table(userResult.rows);
      
      const userId = userResult.rows[0].Id;
      
      // Check if this user is assigned as a teacher
      console.log('\n=== Checking ClassTeachers assignments ===');
      const teacherResult = await client.query(`
        SELECT ct.*, sc."ClassName", ps."SiteName"
        FROM "ClassTeachers" ct
        JOIN "SiteClasses" sc ON ct."ClassId" = sc."Id"
        JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
        WHERE ct."TeacherId" = $1 AND ct."IsActive" = true
      `, [userId]);
      
      if (teacherResult.rows.length > 0) {
        console.log('Teacher assignments found:');
        console.table(teacherResult.rows);
      } else {
        console.log('❌ No teacher assignments found for this user');
      }
    } else {
      console.log('❌ User not found');
    }

    // List all users with Teacher role
    console.log('\n=== All users with Teacher role ===');
    const allTeachers = await client.query(`
      SELECT "Id", "Name", "Email", "Role", "Status", "CreatedAt"
      FROM "Users"
      WHERE "Role" = 'Teacher'
      ORDER BY "CreatedAt" DESC
    `);
    
    if (allTeachers.rows.length > 0) {
      console.table(allTeachers.rows);
    } else {
      console.log('❌ No users with Teacher role found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTeacherRole();
