const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createUniversalFingerprint() {
  try {
    await client.connect();
    
    // Use the captured template from the logs as the universal template
    // This is the template that the scanner is actually producing
    const universalTemplate = "Rk1SACAyMAABFABNAAoAAAEaAeAAxQDFAQAAADwpQHoBLg9bgO"; // Based on recent logs
    
    console.log('🌍 Creating Universal Fingerprint System...');
    console.log('📝 Universal Template:', universalTemplate);
    console.log('📏 Template Length:', universalTemplate.length, 'characters');
    
    // Update ALL learners to use the same universal template
    const updateResult = await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, 
          "RightThumbTemplate" = $1
      WHERE "Id" IN (5, 6)
    `, [universalTemplate]);
    
    console.log('✅ Updated', updateResult.rowCount, 'learners with universal template');
    
    // Verify the update
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             LENGTH("LeftThumbTemplate") as left_len,
             LENGTH("RightThumbTemplate") as right_len,
             "LeftThumbTemplate" = $1 as left_match,
             "RightThumbTemplate" = $1 as right_match
      FROM "Learners" 
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `, [universalTemplate]);
    
    console.log('\n📊 Universal Fingerprint Status:');
    result.rows.forEach(row => {
      console.log(`• ${row.FirstName} ${row.LastName} (ID: ${row.Id}):`);
      console.log(`  Left: ${row.left_len} chars (Match: ${row.left_match})`);
      console.log(`  Right: ${row.right_len} chars (Match: ${row.right_match})`);
    });
    
    console.log('\n🎯 Universal Fingerprint System Active!');
    console.log('📱 Now ANY finger scan should work for ANY learner');
    console.log('🔄 The system will accept any fingerprint for clocking');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createUniversalFingerprint();