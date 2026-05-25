const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345',
  port: 5432
});

async function verifySpecificUser() {
  try {
    await client.connect();
    const email = 'ngidinokwe@gmail.com';
    const password = 'Teacher123!';
    
    const res = await client.query('SELECT "PasswordHash" FROM "Users" WHERE "Email" = $1', [email]);
    if (res.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const hash = res.rows[0].PasswordHash;
    const match = await bcrypt.compare(password, hash);
    console.log(`Verification for ${email}: ${match ? 'SUCCESS' : 'FAILURE'}`);
    console.log(`Hash in DB: ${hash}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

verifySpecificUser();
