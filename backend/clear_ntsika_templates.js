const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function clearNtsikaTemplates() {
  try {
    console.log('=== Clearing Ntsika\'s Fingerprint Templates ===');
    
    const query = `
      UPDATE "Learners" 
      SET 
        "LeftThumbTemplate" = NULL,
        "RightThumbTemplate" = NULL
      WHERE "Id" = 5
    `;
    
    await pool.query(query);
    console.log('✅ Cleared Ntsika\'s fingerprint templates');
    console.log('📱 Now you can re-register his fingerprints in the app');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

clearNtsikaTemplates();