const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function debugAttendanceTracking() {
  try {
    await client.connect();
    console.log('🔍 Debugging Attendance Tracking Data...\n');
    
    // Check projects
    console.log('1. Projects:');
    const projects = await client.query('SELECT "Id", "ProjectName" FROM "Projects" ORDER BY "ProjectName"');
    projects.rows.forEach(row => {
      console.log(`   - ID: ${row.Id}, Name: ${row.ProjectName}`);
    });
    console.log(`   Total: ${projects.rows.length} projects\n`);
    
    // Check project sites
    console.log('2. Project Sites:');
    const sites = await client.query(`
      SELECT ps."Id", ps."ProjectId", ps."SiteName", p."ProjectName"
      FROM "ProjectSites" ps
      JOIN "Projects" p ON ps."ProjectId" = p."Id"
      ORDER BY p."ProjectName", ps."SiteName"
    `);
    sites.rows.forEach(row => {
      console.log(`   - Site ID: ${row.Id}, Project: ${row.ProjectName}, Site: ${row.SiteName}`);
    });
    console.log(`   Total: ${sites.rows.length} sites\n`);
    
    // Check site classes
    console.log('3. Site Classes:');
    const classes = await client.query(`
      SELECT sc."Id", sc."ClassName", ps."SiteName", p."ProjectName"
      FROM "SiteClasses" sc
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      JOIN "Projects" p ON ps."ProjectId" = p."Id"
      ORDER BY p."ProjectName", ps."SiteName", sc."ClassName"
    `);
    classes.rows.forEach(row => {
      console.log(`   - Class ID: ${row.Id}, Project: ${row.ProjectName}, Site: ${row.SiteName}, Class: ${row.ClassName}`);
    });
    console.log(`   Total: ${classes.rows.length} classes\n`);
    
    // Check class enrollments
    console.log('4. Class Enrollments:');
    const enrollments = await client.query(`
      SELECT ce."Id", ce."LearnerId", ce."SiteClassId", ce."Status", 
             l."FirstName", l."LastName", sc."ClassName", p."ProjectName"
      FROM "ClassEnrollments" ce
      JOIN "Learners" l ON ce."LearnerId" = l."Id"
      JOIN "SiteClasses" sc ON ce."SiteClassId" = sc."Id"
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      JOIN "Projects" p ON ps."ProjectId" = p."Id"
      WHERE ce."Status" = 'Active'
      ORDER BY p."ProjectName", l."LastName", l."FirstName"
    `);
    enrollments.rows.forEach(row => {
      console.log(`   - Enrollment ID: ${row.Id}, Learner: ${row.FirstName} ${row.LastName}, Class: ${row.ClassName}, Project: ${row.ProjectName}, Status: ${row.Status}`);
    });
    console.log(`   Total: ${enrollments.rows.length} active enrollments\n`);
    
    // Check attendance records
    console.log('5. Learner Attendance Records:');
    const attendance = await client.query(`
      SELECT la."Id", la."LearnerId", la."ClassId", la."AttendanceDate", 
             la."ClockInTime", la."ClockOutTime", la."Status",
             l."FirstName", l."LastName"
      FROM "LearnerAttendances" la
      JOIN "Learners" l ON la."LearnerId" = l."Id"
      ORDER BY la."AttendanceDate" DESC, l."LastName", l."FirstName"
      LIMIT 20
    `);
    attendance.rows.forEach(row => {
      console.log(`   - ID: ${row.Id}, Learner: ${row.FirstName} ${row.LastName}, Date: ${row.AttendanceDate}, Clock In: ${row.ClockInTime}, Status: ${row.Status}`);
    });
    console.log(`   Total: ${attendance.rows.length} attendance records (showing last 20)\n`);
    
    // Check today's attendance
    const today = new Date().toISOString().split('T')[0];
    console.log(`6. Today's Attendance (${today}):`);
    const todayAttendance = await client.query(`
      SELECT la."Id", la."LearnerId", la."ClassId", la."ClockInTime", 
             l."FirstName", l."LastName", sc."ClassName", p."ProjectName"
      FROM "LearnerAttendances" la
      JOIN "Learners" l ON la."LearnerId" = l."Id"
      JOIN "SiteClasses" sc ON la."ClassId" = sc."Id"
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      JOIN "Projects" p ON ps."ProjectId" = p."Id"
      WHERE la."AttendanceDate" = $1 AND la."ClockInTime" IS NOT NULL
      ORDER BY p."ProjectName", l."LastName", l."FirstName"
    `, [today]);
    todayAttendance.rows.forEach(row => {
      console.log(`   - Learner: ${row.FirstName} ${row.LastName}, Project: ${row.ProjectName}, Class: ${row.ClassName}, Clock In: ${row.ClockInTime}`);
    });
    console.log(`   Total: ${todayAttendance.rows.length} present today\n`);
    
    // Test the exact query from AttendanceTrackingController
    console.log('7. Testing AttendanceTrackingController Query:');
    const controllerQuery = `
      SELECT p."Id" as "ProjectId", p."ProjectName",
             COUNT(DISTINCT ce."LearnerId") as "TotalLearners",
             COUNT(DISTINCT CASE WHEN la."AttendanceDate" = $1 AND la."ClockInTime" IS NOT NULL THEN la."LearnerId" END) as "PresentToday",
             COUNT(DISTINCT sc."Id") as "TotalClasses"
      FROM "Projects" p
      LEFT JOIN "ProjectSites" ps ON p."Id" = ps."ProjectId"
      LEFT JOIN "SiteClasses" sc ON ps."Id" = sc."ProjectSiteId"
      LEFT JOIN "ClassEnrollments" ce ON sc."Id" = ce."SiteClassId" AND ce."Status" = 'Active'
      LEFT JOIN "LearnerAttendances" la ON ce."LearnerId" = la."LearnerId"
      GROUP BY p."Id", p."ProjectName"
      HAVING COUNT(DISTINCT ce."LearnerId") > 0
      ORDER BY p."ProjectName"
    `;
    
    const controllerResult = await client.query(controllerQuery, [today]);
    controllerResult.rows.forEach(row => {
      console.log(`   - Project: ${row.ProjectName}, Total Learners: ${row.TotalLearners}, Present Today: ${row.PresentToday}, Classes: ${row.TotalClasses}`);
    });
    console.log(`   Total projects with learners: ${controllerResult.rows.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugAttendanceTracking();