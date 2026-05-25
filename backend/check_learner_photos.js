const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkLearnerPhotos() {
  try {
    console.log('🔍 Checking learner profile photos...\n');
    
    const result = await pool.query(`
      SELECT 
        l."Id",
        l."FirstName",
        l."LastName",
        l."ProfilePhotoPath",
        CASE 
          WHEN l."ProfilePhotoPath" IS NOT NULL THEN 'Has Photo'
          ELSE 'No Photo'
        END as photo_status
      FROM "Learners" l
      ORDER BY l."LastName", l."FirstName"
    `);
    
    console.log(`Found ${result.rows.length} learners:`);
    console.log('=====================================');
    
    result.rows.forEach(learner => {
      console.log(`📋 ${learner.FirstName} ${learner.LastName} (ID: ${learner.Id})`);
      console.log(`   Status: ${learner.photo_status}`);
      if (learner.ProfilePhotoPath) {
        console.log(`   Path: ${learner.ProfilePhotoPath}`);
      }
      console.log('');
    });
    
    const withPhotos = result.rows.filter(l => l.ProfilePhotoPath);
    const withoutPhotos = result.rows.filter(l => !l.ProfilePhotoPath);
    
    console.log(`📊 Summary:`);
    console.log(`   Learners with photos: ${withPhotos.length}`);
    console.log(`   Learners without photos: ${withoutPhotos.length}`);
    
  } catch (error) {
    console.error('❌ Error checking learner photos:', error);
  } finally {
    await pool.end();
  }
}

checkLearnerPhotos();