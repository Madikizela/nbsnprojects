const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function resetPassword() {
  try {
    const teacherId = 49;
    const newPassword = 'Teacher123!';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    await pool.query(
      'UPDATE "Users" SET "PasswordHash" = $1 WHERE "Id" = $2',
      [hashedPassword, teacherId]
    );
    
    console.log('✅ Password reset successfully');
    console.log('📧 Email: sthembisomaphango@gmail.com');
    console.log('🔑 Password:', newPassword);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetPassword();
