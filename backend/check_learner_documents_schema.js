const { Client } = require('pg');

async function checkLearnerDocumentsSchema() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rlms',
    password: '12345',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔍 Checking LearnerDocuments table schema...\n');

    // Check table schema
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'LearnerDocuments' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 LearnerDocuments table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default || 'none'}`);
    });

    // Check if approval fields exist
    const approvalFields = ['ApprovalStatus', 'ApprovedByUserId', 'ApprovedAt', 'DeclineReason'];
    console.log('\n🔍 Checking for approval fields:');
    approvalFields.forEach(field => {
      const exists = schemaResult.rows.some(col => col.column_name === field);
      console.log(`   ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    // Try to select from the table to see current data
    console.log('\n📄 Current LearnerDocuments data:');
    const dataResult = await client.query(`
      SELECT "Id", "LearnerId", "DocumentType", "FileName", "ApprovalStatus", "ApprovedByUserId", "ApprovedAt", "DeclineReason"
      FROM "LearnerDocuments" 
      ORDER BY "Id"
    `);
    
    dataResult.rows.forEach(doc => {
      console.log(`   ID: ${doc.Id}, Learner: ${doc.LearnerId}, Type: ${doc.DocumentType}, Status: ${doc.ApprovalStatus || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkLearnerDocumentsSchema();