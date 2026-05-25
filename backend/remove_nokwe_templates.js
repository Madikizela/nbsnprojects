const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function removeNokweTemplates() {
  try {
    await client.connect();
    
    console.log('🗑️ Removing Nokwe\'s fingerprint templates...');
    
    // Remove Nokwe's templates completely (set to NULL)
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = NULL, "RightThumbTemplate" = NULL
      WHERE "Id" = 6
    `);
    
    // Keep Ntsika's template (the one that matches his real fingerprint)
    const ntsikTemplate = "Rk1SACAyMAABFgBNAAoAAAEcAeAAxQDFAQAAADwpQHoBLg9bgO";
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 5
    `, [ntsikTemplate]);
    
    console.log('✅ Templates updated');
    
    // Verify the update
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             LENGTH("LeftThumbTemplate") as left_len,
             LENGTH("RightThumbTemplate") as right_len,
             CASE 
               WHEN "LeftThumbTemplate" IS NULL THEN 'NO TEMPLATE'
               ELSE SUBSTRING("LeftThumbTemplate", 1, 15) || '...'
             END as template_preview
      FROM "Learners" 
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `);
    
    console.log('\n📊 Final Template Status:');
    result.rows.forEach(row => {
      console.log(`• ${row.FirstName} ${row.LastName} (ID: ${row.Id}):`);
      console.log(`  Left: ${row.left_len || 0} chars, Right: ${row.right_len || 0} chars`);
      console.log(`  Template: ${row.template_preview}`);
    });
    
    console.log('\n🎯 Perfect Setup!');
    console.log('✅ Only Ntsika can clock in (has fingerprint template)');
    console.log('❌ Nokwe cannot clock in (no fingerprint template)');
    console.log('📱 System will only match Ntsika\'s registered fingerprint');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

removeNokweTemplates();