const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
  });

  try {
    await client.connect();
    console.log('✅ Connected');

    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'SkillsDevelopmentProviders'
      ORDER BY ordinal_position;
    `);

    console.log('📋 SkillsDevelopmentProviders columns:');
    for (const row of columns.rows) {
      console.log(`- ${row.column_name} (${row.data_type})`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();