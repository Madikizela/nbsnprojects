const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function fixAdminStatus() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check current status
    console.log('\n📋 Checking current admin status...');
    const checkQuery = `
      SELECT "Id", "Email", "Status"
      FROM "SystemAdmins" 
      WHERE "Email" = $1
    `;
    
    const checkResult = await client.query(checkQuery, ['admin@system.local']);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ No admin found');
      return;
    }
    
    const admin = checkResult.rows[0];
    console.log(`Current status: ${admin.Status}`);
    
    if (admin.Status === 0) {
      console.log('✅ Admin status is already 0 (active)');
      return;
    }
    
    // Update status to 0 (active)
    console.log('\n🔧 Updating admin status to 0 (active)...');
    const updateQuery = `
      UPDATE "SystemAdmins" 
      SET "Status" = 0 
      WHERE "Email" = $1
    `;
    
    await client.query(updateQuery, ['admin@system.local']);
    
    // Verify the update
    const verifyResult = await client.query(checkQuery, ['admin@system.local']);
    const updatedAdmin = verifyResult.rows[0];
    
    console.log(`✅ Admin status updated to: ${updatedAdmin.Status}`);
    console.log('✅ Admin account is now active and ready for login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixAdminStatus();