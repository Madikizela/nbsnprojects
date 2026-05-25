const { Client } = require('pg');

async function checkUsersForApproval() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rlms',
    password: '12345',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('🔍 Checking users for document approval...\n');

    // Check Users table
    const usersResult = await client.query('SELECT "Id", "FirstName", "LastName", "Email", "Role" FROM "Users" ORDER BY "Id" LIMIT 10');
    console.log('👥 Users in database:');
    usersResult.rows.forEach(user => {
      console.log(`   ID: ${user.Id}, Name: ${user.FirstName} ${user.LastName}, Email: ${user.Email}, Role: ${user.Role}`);
    });

    // Check if there are any system admins
    const adminsResult = await client.query('SELECT "Id", "FirstName", "LastName", "Email" FROM "SystemAdmins" ORDER BY "Id" LIMIT 5');
    console.log('\n🔧 System Admins:');
    adminsResult.rows.forEach(admin => {
      console.log(`   ID: ${admin.Id}, Name: ${admin.FirstName} ${admin.LastName}, Email: ${admin.Email}`);
    });

    // Check current document approval statuses
    const documentsResult = await client.query(`
      SELECT "Id", "LearnerId", "DocumentType", "FileName", "ApprovalStatus", "ApprovedByUserId", "ApprovedAt", "DeclineReason"
      FROM "LearnerDocuments" 
      ORDER BY "Id"
    `);
    console.log('\n📄 Current document statuses:');
    documentsResult.rows.forEach(doc => {
      console.log(`   ID: ${doc.Id}, Learner: ${doc.LearnerId}, Type: ${doc.DocumentType}, Status: ${doc.ApprovalStatus}, ApprovedBy: ${doc.ApprovedByUserId}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersForApproval();