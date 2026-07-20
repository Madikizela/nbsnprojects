const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nbsnproject',
  user: 'postgres',
  password: 'postgres'
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
    console.log('✅ ZKTeco fingerprint columns added successfully');
    return client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Learners' AND column_name LIKE '%Thumb%' 
      ORDER BY column_name
    `);
  })
  .then((result) => {
    console.log('\nCurrent Thumb columns:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}`);
    });
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    client.end();
  });
