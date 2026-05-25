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
    return client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Learners' 
      ORDER BY ordinal_position
    `);
  })
  .then(res => {
    console.log('Learners table columns:');
    res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
