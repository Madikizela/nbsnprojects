// Manual password reset for learner - bypasses email requirement
// Usage: node reset_learner_password_manual.js <email> <new-password>

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node reset_learner_password_manual.js <email> <new-password>');
  console.log('Example: node reset_learner_password_manual.js nbsnprojects@gmail.com NewPass123!');
  process.exit(1);
}

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nbsnproject',
  user: 'postgres',
  password: 'postgres'
});

async function resetPassword() {
  try {
    await client.connect();
    console.log(`\n🔄 Resetting password for: ${email}`);
    
    // Check if learner exists
    const checkQuery = 'SELECT "Id", "FirstName", "LastName", "Email" FROM "Learners" WHERE "Email" ILIKE $1';
    const checkResult = await client.query(checkQuery, [email]);
    
    if (checkResult.rows.length === 0) {
      console.log(`❌ Error: No learner found with email ${email}`);
      process.exit(1);
    }
    
    const learner = checkResult.rows[0];
    console.log(`✅ Found learner: ${learner.FirstName} ${learner.LastName} (ID: ${learner.Id})`);
    
    // Hash the new password with BCrypt cost 12 (matching your system)
    console.log(`\n🔐 Hashing password...`);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password and clear reset tokens
    const updateQuery = `
      UPDATE "Learners" 
      SET "PasswordHash" = $1,
          "MustChangePassword" = false,
          "PasswordResetToken" = NULL,
          "PasswordResetTokenExpiry" = NULL,
          "UpdatedAt" = NOW()
      WHERE "Id" = $2
    `;
    
    await client.query(updateQuery, [passwordHash, learner.Id]);
    
    console.log(`\n✅ Password reset successful!`);
    console.log(`\n📋 Login Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`\n🌐 Login at: http://192.168.0.53:5174`);
    console.log(`\n✅ MustChangePassword set to false - no forced password change`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetPassword();
