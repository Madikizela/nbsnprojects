const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function updateAzolaToTeacher() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Find Azola
    console.log('=== Finding Azola Maphango ===');
    const userResult = await client.query(`
      SELECT "Id", "FirstName", "LastName", "Email", "Role"
      FROM "Users"
      WHERE "Email" = 'sthembisomaphango@gmail.com'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('User found:');
    console.table([user]);

    // Update role to Teacher (16)
    console.log('\n=== Updating role to Teacher (16) ===');
    await client.query(`
      UPDATE "Users"
      SET "Role" = 16
      WHERE "Id" = $1
    `, [user.Id]);

    console.log('✅ Role updated successfully!');

    // Verify update
    const verifyResult = await client.query(`
      SELECT "Id", "FirstName", "LastName", "Email", "Role"
      FROM "Users"
      WHERE "Id" = $1
    `, [user.Id]);

    console.log('\n=== Verified User ===');
    console.table(verifyResult.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

updateAzolaToTeacher();
