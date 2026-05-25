const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createTables() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const sql = fs.readFileSync('create_teacher_attendance_system.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Teacher attendance tables created successfully');
    
    // Verify tables were created
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ClassTeachers', 'LearnerAttendance', 'AttendanceLog')
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created tables:');
    res.rows.forEach(r => console.log(`  ✓ ${r.table_name}`));
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTables();
