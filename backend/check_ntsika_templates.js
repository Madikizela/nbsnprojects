const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkNtsikaTemplates() {
  try {
    console.log('=== Checking Ntsika\'s Fingerprint Templates ===');
    
    const query = `
      SELECT 
        l."Id",
        l."FirstName",
        l."LastName",
        CASE WHEN l."LeftThumbTemplate" IS NOT NULL THEN LENGTH(l."LeftThumbTemplate") ELSE 0 END as "LeftTemplateLength",
        CASE WHEN l."RightThumbTemplate" IS NOT NULL THEN LENGTH(l."RightThumbTemplate") ELSE 0 END as "RightTemplateLength",
        CASE WHEN l."LeftThumbTemplate" IS NOT NULL THEN SUBSTRING(l."LeftThumbTemplate", 1, 50) ELSE 'NULL' END as "LeftPreview",
        CASE WHEN l."RightThumbTemplate" IS NOT NULL THEN SUBSTRING(l."RightThumbTemplate", 1, 50) ELSE 'NULL' END as "RightPreview"
      FROM "Learners" l
      WHERE l."Id" = 5
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ Ntsika not found');
      return;
    }
    
    const learner = result.rows[0];
    console.log(`\n📋 Learner: ${learner.FirstName} ${learner.LastName} (ID: ${learner.Id})`);
    console.log(`📏 Left Template Length: ${learner.LeftTemplateLength}`);
    console.log(`📏 Right Template Length: ${learner.RightTemplateLength}`);
    console.log(`👈 Left Preview: ${learner.LeftPreview}`);
    console.log(`👉 Right Preview: ${learner.RightPreview}`);
    
    // Check attendance status
    const today = new Date().toISOString().split('T')[0];
    const attendanceQuery = `
      SELECT 
        "ClockInTime",
        "ClockOutTime",
        "Status"
      FROM "LearnerAttendances"
      WHERE "LearnerId" = 5 AND "AttendanceDate" = $1
    `;
    
    const attendanceResult = await pool.query(attendanceQuery, [today]);
    
    console.log(`\n📅 Today's Attendance (${today}):`);
    if (attendanceResult.rows.length === 0) {
      console.log('❌ No attendance record for today');
    } else {
      const attendance = attendanceResult.rows[0];
      console.log(`⏰ Clock In: ${attendance.ClockInTime || 'Not clocked in'}`);
      console.log(`⏰ Clock Out: ${attendance.ClockOutTime || 'Not clocked out'}`);
      console.log(`📊 Status: ${attendance.Status}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNtsikaTemplates();