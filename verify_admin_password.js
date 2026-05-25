const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345',
  port: 5432
});

async function verifyPassword() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');
    
    // Get the admin account
    const result = await client.query(
      'SELECT "Id", "Email", "PasswordHash", "Status" FROM "SystemAdmins" WHERE "Email" = $1',
      ['admin@system.local']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No admin account found!');
      return;
    }
    
    const admin = result.rows[0];
    console.log('Admin Account:');
    console.log('  Email:', admin.Email);
    console.log('  Status:', admin.Status);
    console.log('  Password Hash:', admin.PasswordHash.substring(0, 30) + '...');
    console.log('');
    
    // Test password verification
    const testPassword = 'Admin@123';
    const isValid = await bcrypt.compare(testPassword, admin.PasswordHash);
    
    console.log(`Testing password: "${testPassword}"`);
    console.log(`Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log('');
    
    // Also test the other password
    const testPassword2 = 'Admin@123!System';
    const isValid2 = await bcrypt.compare(testPassword2, admin.PasswordHash);
    
    console.log(`Testing password: "${testPassword2}"`);
    console.log(`Result: ${isValid2 ? '✅ VALID' : '❌ INVALID'}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

verifyPassword();
