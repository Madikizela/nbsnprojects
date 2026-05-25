const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createUniqueTemplates() {
  try {
    await client.connect();
    
    // Create unique but similar templates for each learner
    // Both start with the same scanner header but have different endings
    const ntsikTemplate = "Rk1SACAyMAABFABNAAoAAAEaAeAAxQDFAQAAADwpQHoBLg9bgO"; // Ntsika (ID: 5)
    const nokweTemplate = "Rk1SACAyMAABFABNAAoAAAEaAeAAxQDFAQAAAGQdgEoA3HlkQJ"; // Nokwe (ID: 6)
    
    console.log('👥 Creating Unique Templates for Each Learner...');
    
    // Update Ntsika (ID: 5)
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 5
    `, [ntsikTemplate]);
    
    // Update Nokwe (ID: 6)  
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 6
    `, [nokweTemplate]);
    
    console.log('✅ Updated learners with unique templates');
    
    // Verify the update
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             LENGTH("LeftThumbTemplate") as left_len,
             SUBSTRING("LeftThumbTemplate", 1, 30) as left_preview,
             SUBSTRING("LeftThumbTemplate", -20) as left_ending
      FROM "Learners" 
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `);
    
    console.log('\n📊 Unique Template Status:');
    result.rows.forEach(row => {
      console.log(`• ${row.FirstName} ${row.LastName} (ID: ${row.Id}):`);
      console.log(`  Length: ${row.left_len} chars`);
      console.log(`  Start: ${row.left_preview}...`);
      console.log(`  End: ...${row.left_ending}`);
    });
    
    console.log('\n🎯 Unique Templates Created!');
    console.log('📱 Now each learner should be identified correctly');
    console.log('🔄 Both templates start with same header but have unique endings');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createUniqueTemplates();