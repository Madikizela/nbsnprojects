const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkSickNotes() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM "SickNotes"');
    console.log(`Found ${res.rows.length} records in SickNotes table.`);
    if (res.rows.length > 0) {
      console.log('Sample record:', JSON.stringify(res.rows[0], null, 2));
    }
  } catch (err) {
    console.error('Error checking SickNotes:', err.message);
  } finally {
    await client.end();
  }
}

checkSickNotes();
