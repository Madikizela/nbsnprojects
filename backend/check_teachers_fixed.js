const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkTeachers() {
  try {
    const result = await pool.query(`
      SELECT "Id", "FirstName", "LastName", "Email", "Role", "PhoneNumber", "PracticeNumber"
      FROM "Users" 
      WHERE "Role" = 16
      ORDER BY "Id"
    `);

    console.log('👨‍🏫 Teachers in database:');
    console.log('='.repeat(80));
    result.rows.forEach(teacher => {
      console.log(`ID: ${teacher.Id}`);
      console.log(`Name: ${teacher.FirstName} ${teacher.LastName}`);
      console.log(`Email: ${teacher.Email}`);
      console.log(`Phone: ${teacher.PhoneNumber || 'Not set'}`);
      console.log(`Practice Number: ${teacher.PracticeNumber || 'Not set'}`);
      console.log('-'.repeat(80));
    });

    console.log(`\nTotal teachers: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTeachers();
