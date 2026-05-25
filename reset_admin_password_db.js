const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345',
  port: 5432
});

async function resetPassword() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    console.log('');
    
    // Hash the new password
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log(`Hashing password: ${newPassword}`);
    console.log(`Hash: ${hashedPassword.substring(0, 30)}...`);
    console.log('');
    
    // Update the admin password
    const result = await client.query(
      'UPDATE "SystemAdmins" SET "PasswordHash" = $1, "UpdatedAt" = NOW() WHERE "Email" = $2 RETURNING "Id", "Email"',
      [hashedPassword, 'admin@system.local']
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('');
      console.log('Admin credentials:');
      console.log('  Email: admin@system.local');
      console.log('  Password: Admin@123');
    } else {
      console.log('❌ No admin account found with email: admin@system.local');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

resetPassword();
