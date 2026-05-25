const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function updateTemplateWithCaptured() {
  try {
    await client.connect();
    console.log('🔧 Template Update Utility\n');

    // Based on the latest logs, the captured template was 236 characters
    console.log('📋 Instructions:');
    console.log('1. Try to clock in with Ntsika\'s fingerprint');
    console.log('2. Copy the FULL captured template from the backend logs');
    console.log('3. Replace the PLACEHOLDER below with the actual template');
    console.log('4. Run this script to update the database');
    console.log('5. Immediately test clocking with the same finger');
    console.log('');

    // Placeholder - replace with actual captured template
    const capturedTemplate = "REPLACE_WITH_ACTUAL_CAPTURED_TEMPLATE_FROM_LOGS";
    
    if (capturedTemplate === "REPLACE_WITH_ACTUAL_CAPTURED_TEMPLATE_FROM_LOGS") {
      console.log('❌ Please replace the placeholder with the actual captured template first');
      return;
    }

    // Update Ntsika's left thumb template
    await client.query(`
      UPDATE "Learners"
      SET "LeftThumbTemplate" = $1
      WHERE "Id" = 5
    `, [capturedTemplate]);

    console.log('✅ Updated Ntsika\'s left thumb template');
    console.log(`Template length: ${capturedTemplate.length} characters`);
    console.log('');
    console.log('🎯 Now test clocking immediately with the same finger!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateTemplateWithCaptured();