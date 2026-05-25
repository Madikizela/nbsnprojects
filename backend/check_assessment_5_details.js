const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkAssessment5Details() {
  try {
    console.log('🔍 Checking Assessment 5 Details...\n');
    
    // Check Assessment 5 details
    const result = await pool.query('SELECT * FROM "FormativeAssessments" WHERE "Id" = 5');
    console.log('Assessment 5 details:');
    console.log(result.rows[0]);
    
    // Check what the API endpoint should return
    const apiResult = await pool.query(`
      SELECT fa."Id" as id, fa."ProjectQualificationUnitStandardId" as projectQualificationUnitStandardId,
             fa."Title" as title, fa."Description" as description
      FROM "FormativeAssessments" fa
      WHERE fa."Id" = 5
    `);
    
    console.log('\nAPI endpoint should return:');
    console.log(apiResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAssessment5Details();