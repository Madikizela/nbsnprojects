const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function resetFingerprintsAndAttendance() {
  try {
    await client.connect();
    console.log('🧹 Resetting Fingerprint Templates and Attendance Records\n');

    // 1. Clear all fingerprint templates
    console.log('1️⃣ Clearing fingerprint templates...');
    await client.query(`
      UPDATE "Learners"
      SET "LeftThumbTemplate" = NULL, "RightThumbTemplate" = NULL
      WHERE "Id" IN (5, 6)
    `);
    console.log('   ✅ Cleared fingerprint templates for Ntsika (ID: 5) and Nokwe (ID: 6)');

    // 2. Delete all attendance records for today
    console.log('\n2️⃣ Clearing today\'s attendance records...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const attendanceResult = await client.query(`
      DELETE FROM "LearnerAttendances"
      WHERE "AttendanceDate" = $1
      AND "LearnerId" IN (5, 6)
    `, [today]);
    console.log(`   ✅ Deleted ${attendanceResult.rowCount} attendance records for today`);

    // 3. Delete all attendance logs for today
    console.log('\n3️⃣ Clearing today\'s attendance logs...');
    const logsResult = await client.query(`
      DELETE FROM "AttendanceLogs"
      WHERE DATE("ActionTime") = $1
    `, [today]);
    console.log(`   ✅ Deleted ${logsResult.rowCount} attendance log entries for today`);

    // 4. Verify the cleanup
    console.log('\n4️⃣ Verifying cleanup...');
    
    const learnerCheck = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             CASE WHEN "LeftThumbTemplate" IS NULL THEN 'NULL' ELSE 'HAS_DATA' END as "LeftThumb",
             CASE WHEN "RightThumbTemplate" IS NULL THEN 'NULL' ELSE 'HAS_DATA' END as "RightThumb"
      FROM "Learners"
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `);

    console.log('   📊 Learner Templates Status:');
    learnerCheck.rows.forEach(row => {
      console.log(`   • ${row.FirstName} ${row.LastName} (ID: ${row.Id}): Left=${row.LeftThumb}, Right=${row.RightThumb}`);
    });

    const attendanceCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM "LearnerAttendances"
      WHERE "AttendanceDate" = $1
      AND "LearnerId" IN (5, 6)
    `, [today]);

    console.log(`   📊 Remaining attendance records for today: ${attendanceCheck.rows[0].count}`);

    console.log('\n✅ Reset Complete!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Open the mobile app');
    console.log('2. Go to Learners → Ntsika Maphango → Edit Profile');
    console.log('3. Register his fingerprint (left or right thumb)');
    console.log('4. Save the profile');
    console.log('5. Go to Learners → Nokwe Ngidi → Edit Profile');
    console.log('6. Register her fingerprint (left or right thumb)');
    console.log('7. Save the profile');
    console.log('8. Test attendance clocking with fresh templates');
    console.log('\n💡 Tip: Register different fingers for each learner to avoid confusion');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetFingerprintsAndAttendance();