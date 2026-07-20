
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

client.connect()
  .then(() => {
    console.log('Connected to database');
    return client.query(`
      ALTER TABLE "Learners" 
      ADD COLUMN IF NOT EXISTS "LeftThumbTemplateZk" TEXT,
      ADD COLUMN IF NOT EXISTS "RightThumbTemplateZk" TEXT
    `);
  })
  .then(() => {
    console.log('✅ ZKTECO fingerprint columns added successfully');
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    client.end();
  });
