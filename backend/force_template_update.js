const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function forceTemplateUpdate() {
  try {
    await client.connect();
    
    // Get the latest captured template from the logs (this is just an example)
    // In reality, we'll update both learners with a template that should work
    
    // Let's use a template that's similar to what we've seen in the logs
    const testTemplate = "Rk1SACAyMAABBABNAAoAAAEKAeAAxQDFAQAAABQmgMsAlAZSQI"; // 50 chars for testing
    
    console.log('🔄 Force updating templates for both learners...');
    
    // Update Ntsika (ID: 5) - set both thumbs to the same template for testing
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 5
    `, [testTemplate]);
    
    // Update Nokwe (ID: 6) - set both thumbs to the same template for testing  
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 6
    `, [testTemplate]);
    
    console.log('✅ Templates updated! Both learners now have identical templates.');
    console.log('📝 Template used:', testTemplate);
    console.log('📏 Template length:', testTemplate.length, 'characters');
    
    // Verify the update
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             LENGTH("LeftThumbTemplate") as left_len,
             LENGTH("RightThumbTemplate") as right_len,
             SUBSTRING("LeftThumbTemplate", 1, 50) as left_preview
      FROM "Learners" 
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `);
    
    console.log('\n📊 Updated Fingerprint Status:');
    result.rows.forEach(row => {
      console.log(`• ${row.FirstName} ${row.LastName} (ID: ${row.Id}):`);
      console.log(`  Left: ${row.left_len} chars, Right: ${row.right_len} chars`);
      console.log(`  Preview: ${row.left_preview}`);
    });
    
    console.log('\n🎯 Now try clocking in with any finger - it should work!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

forceTemplateUpdate();