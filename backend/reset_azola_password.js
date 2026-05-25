const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function resetPassword() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Hash the password
    const password = 'Teacher123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user
    await client.query(`
      UPDATE "Users"
      SET "PasswordHash" = $1
      WHERE "Email" = 'azolamaphango@gmail.com'
    `, [hashedPassword]);

    console.log('✅ Password reset successfully for azolamaphango@gmail.com');
    console.log(`New password: ${password}`);

    // Verify the user
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", "Email", "Role", "Status"
      FROM "Users"
      WHERE "Email" = 'azolamaphango@gmail.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\nUser details:');
      console.log(`ID: ${user.Id}`);
      console.log(`Name: ${user.FirstName} ${user.LastName}`);
      console.log(`Email: ${user.Email}`);
      console.log(`Role: ${user.Role}`);
      console.log(`Status: ${user.Status}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword();
