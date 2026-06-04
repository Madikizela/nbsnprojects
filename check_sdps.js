const { Client } = require('pg');

const client = new Client({
  host: 'kodama.proxy.rlwy.net',
  port: 37095,
  database: 'railway',
  user: 'postgres',
  password: 'HsHDTqivYAtEBXKhRbnWqWxEWVjsLFLO'
});

client.connect();

client.query('SELECT id, name FROM "SkillsDevelopmentProviders" LIMIT 5', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('SDPs found:', res.rows.length);
    res.rows.forEach(row => console.log(`  - ID: ${row.id}, Name: ${row.name}`));
  }
  client.end();
});
