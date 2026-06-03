
const { Client } = require('pg');

async function tryConnection(config, label) {
  console.log(`\n🔍 Trying connection: ${label}`);
  console.log(`   Config: host=${config.host}, port=${config.port}, user=${config.user}, db=${config.database}`);
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('   ✅ Connection successful!');
    
    const result = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname');
    console.log('\n📦 Available Databases:');
    result.rows.forEach(row => console.log(`   - ${row.datname}`));
    
    return { success: true, client, databases: result.rows.map(r => r.datname) };
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return { success: false };
  }
}

async function main() {
  // Try different config combinations
  const configs = [
    { label: 'Config 1 (5432, 12345)', host: 'localhost', port: 5432, user: 'postgres', password: '12345', database: 'postgres' },
    { label: 'Config 2 (5432, postgres)', host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' },
    { label: 'Config 3 (5433, 12345)', host: 'localhost', port: 5433, user: 'postgres', password: '12345', database: 'postgres' },
    { label: 'Config 4 (5433, postgres)', host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'postgres' },
  ];

  for (const config of configs) {
    const result = await tryConnection(config, config.label);
    if (result.success) {
      await result.client.end();
      return result.databases;
    }
  }

  console.log('\n❌ All connection attempts failed!');
  return [];
}

main();
