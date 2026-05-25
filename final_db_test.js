const { Client } = require('pg');

const passwords = ['12345', 'postgres', 'admin', 'password'];
const ports = [5432, 5433];

async function testAll() {
  for (const port of ports) {
    console.log(`\n--- Testing Port ${port} ---`);
    for (const password of passwords) {
      const client = new Client({
        host: 'localhost',
        user: 'postgres',
        password: password,
        port: port,
        database: 'postgres',
        connectionTimeoutMillis: 2000
      });

      try {
        await client.connect();
        console.log(`✅ SUCCESS on Port ${port} with Password "${password}"`);
        await client.end();
      } catch (err) {
        console.log(`❌ Port ${port}, Password "${password}": ${err.message}`);
      }
    }
  }
}

testAll();
