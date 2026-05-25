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
    return client.query('ALTER TABLE "Learners" ADD COLUMN IF NOT EXISTS "ProfilePhotoPath" VARCHAR(500)');
  })
  .then(() => {
    console.log('✅ ProfilePhotoPath column added successfully');
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    client.end();
  });
