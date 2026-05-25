const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkFingerprints() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             LENGTH("LeftThumbTemplate") as left_len,
             LENGTH("RightThumbTemplate") as right_len,
             SUBSTRING("LeftThumbTemplate", 1, 50) as left_preview,
             SUBSTRING("RightThumbTemplate", 1, 50) as right_preview
      FROM "Learners" 
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `);
    
    console.log('📊 Current Fingerprint Status:');
    result.rows.forEach(row => {
      console.log(`• ${row.FirstName} ${row.LastName} (ID: ${row.Id}):`);
      console.log(`  Left: ${row.left_len || 0} chars - ${row.left_preview || 'NULL'}`);
      console.log(`  Right: ${row.right_len || 0} chars - ${row.right_preview || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkFingerprints();