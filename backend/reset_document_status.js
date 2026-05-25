const { Client } = require('pg');

async function resetDocumentStatus() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rlms',
    password: '12345',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔄 Resetting document statuses to Pending...\n');

    const resetResult = await client.query(`
      UPDATE "LearnerDocuments" 
      SET "ApprovalStatus" = 'Pending', "ApprovedByUserId" = NULL, "ApprovedAt" = NULL, "DeclineReason" = NULL, "UpdatedAt" = NOW()
      WHERE "Id" IN (1, 3, 4)
    `);
    
    console.log('✅ Reset successful:', resetResult.rowCount, 'documents reset');
    
    // Check the result
    const checkResult = await client.query(`
      SELECT "Id", "ApprovalStatus", "ApprovedByUserId", "ApprovedAt", "DeclineReason"
      FROM "LearnerDocuments" 
      WHERE "Id" IN (1, 3, 4)
      ORDER BY "Id"
    `);
    
    console.log('📄 Current document statuses:');
    checkResult.rows.forEach(doc => {
      console.log(`   ID: ${doc.Id}, Status: ${doc.ApprovalStatus}, ApprovedBy: ${doc.ApprovedByUserId || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetDocumentStatus();