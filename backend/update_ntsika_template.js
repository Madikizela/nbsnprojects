const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function updateTemplate() {
  try {
    await client.connect();
    console.log('🔧 Updating Ntsika\'s fingerprint template...\n');

    // Based on the backend logs, the last captured template was 308 characters
    // We'll use a placeholder for now - you'll need to capture a fresh one
    const capturedTemplate = "PLACEHOLDER_308_CHARS"; // This will be replaced with actual captured template
    
    console.log('⚠️  IMPORTANT: This script needs the actual captured template from the backend logs');
    console.log('📋 Steps to get the actual template:');
    console.log('1. Try to clock in Ntsika again');
    console.log('2. Check the backend logs for the captured template');
    console.log('3. Copy the full template and replace PLACEHOLDER_308_CHARS in this script');
    console.log('4. Run this script again');
    console.log('');
    
    // For now, let's just show what we would do:
    console.log('🎯 What this script will do:');
    console.log('- Update Ntsika\'s LeftThumbTemplate with the captured template');
    console.log('- This will allow exact matching to work');
    console.log('- Then you can test clocking immediately');
    
    console.log('\n❌ Script not executed - need actual captured template first');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateTemplate();