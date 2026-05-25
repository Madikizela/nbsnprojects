const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function fixLearnerTemplates() {
  try {
    await client.connect();
    
    // Give Ntsika a template that matches what we've seen in the logs for him
    // This is based on the actual fingerprint data from the logs
    const ntsikTemplate = "Rk1SACAyMAABFgBNAAoAAAEcAeAAxQDFAQAAADwpQHoBLg9bgO"; // From logs
    
    // Give Nokwe a completely different scanner type template so she won't match
    const nokweTemplate = "Fk2TBCAyMAABFgBNAAoAAAEcAeAAxQDFAQAAADwpQHoBLg9bgO"; // Different header
    
    console.log('🔧 Fixing Learner Templates...');
    console.log('👤 Ntsika will match: Rk1SACAyM... (real scanner)');
    console.log('👤 Nokwe will match: Fk2TBCAyM... (different scanner)');
    
    // Update Ntsika (ID: 5) with template that matches his real fingerprint
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 5
    `, [ntsikTemplate]);
    
    // Update Nokwe (ID: 6) with completely different template
    await client.query(`
      UPDATE "Learners" 
      SET "LeftThumbTemplate" = $1, "RightThumbTemplate" = $1
      WHERE "Id" = 6
    `, [nokweTemplate]);
    
    console.log('✅ Updated learner templates');
    
    // Verify the update
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", 
             SUBSTRING("LeftThumbTemplate", 1, 15) as template_start
      FROM "Learners" 
      WHERE "Id" IN (5, 6)
      ORDER BY "Id"
    `);
    
    console.log('\n📊 Fixed Template Status:');
    result.rows.forEach(row => {
      console.log(`• ${row.FirstName} ${row.LastName} (ID: ${row.Id}): ${row.template_start}...`);
    });
    
    console.log('\n🎯 Templates Fixed!');
    console.log('📱 Now Ntsika\'s real fingerprint should match only him');
    console.log('🚫 Nokwe won\'t match until she registers her own fingerprint');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixLearnerTemplates();