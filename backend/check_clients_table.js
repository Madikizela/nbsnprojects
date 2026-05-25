const { Pool } = require('pg');

const client = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

const bcrypt = require('bcryptjs');

async function updateLogisticUser() {
  try {
    // LogisticSupport role in enum is 12
    const result = await client.query(`
      UPDATE "Users"
      SET "Role" = 12
      WHERE "Email" = 'maphangomaphango931@gmail.com'
      RETURNING "Id", "Email", "Role"
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ User updated successfully to Logistic Support (Role 12):', result.rows[0]);
    } else {
      console.log('❌ User maphangomaphango931@gmail.com not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}
updateLogisticUser();