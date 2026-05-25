const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function clearTodayAttendance() {
  try {
    await client.connect();
    const today = new Date().toISOString().split('T')[0];
    
    const result = await client.query(`
      DELETE FROM "LearnerAttendances" 
      WHERE "AttendanceDate" = $1
    `, [today]);
    
    console.log('🧹 Cleared', result.rowCount, 'attendance records for today');
    console.log('📅 Date:', today);
    console.log('✅ Ready for fresh testing!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

clearTodayAttendance();