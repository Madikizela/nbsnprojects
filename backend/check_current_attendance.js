const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkCurrentAttendance() {
  try {
    console.log('=== Checking Current Attendance Status ===');
    
    // Check today's attendance for class 4
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    const attendanceQuery = `
      SELECT 
        la.*,
        l."FirstName",
        l."LastName"
      FROM "LearnerAttendances" la
      JOIN "Learners" l ON la."LearnerId" = l."Id"
      WHERE la."ClassId" = 4 
        AND la."AttendanceDate" = $1
      ORDER BY la."ClockInTime" DESC
    `;
    
    const attendanceResult = await pool.query(attendanceQuery, [today]);
    
    console.log('\n=== Today\'s Attendance Records ===');
    if (attendanceResult.rows.length === 0) {
      console.log('No attendance records found for today');
    } else {
      attendanceResult.rows.forEach(record => {
        console.log(`Learner: ${record.FirstName} ${record.LastName} (ID: ${record.LearnerId})`);
        console.log(`  Clock In: ${record.ClockInTime}`);
        console.log(`  Clock Out: ${record.ClockOutTime || 'Not clocked out'}`);
        console.log(`  Status: ${record.Status}`);
        console.log('  ---');
      });
    }
    
    // Check learners with fingerprints in class 4
    const learnersQuery = `
      SELECT 
        l."Id",
        l."FirstName", 
        l."LastName",
        CASE WHEN l."LeftThumbTemplate" IS NOT NULL THEN 'Yes' ELSE 'No' END as "HasLeftTemplate",
        CASE WHEN l."RightThumbTemplate" IS NOT NULL THEN 'Yes' ELSE 'No' END as "HasRightTemplate"
      FROM "Learners" l
      JOIN "ClassEnrollments" ce ON l."Id" = ce."LearnerId"
      WHERE ce."SiteClassId" = 4 AND ce."Status" = 'Active'
      ORDER BY l."FirstName"
    `;
    
    const learnersResult = await pool.query(learnersQuery);
    
    console.log('\n=== Learners in Class 4 ===');
    learnersResult.rows.forEach(learner => {
      console.log(`${learner.FirstName} ${learner.LastName} (ID: ${learner.Id})`);
      console.log(`  Left Template: ${learner.HasLeftTemplate}`);
      console.log(`  Right Template: ${learner.HasRightTemplate}`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCurrentAttendance();