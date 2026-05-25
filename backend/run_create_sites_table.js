const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createSitesTable() {
  try {
    await client.connect();
    
    const sql = fs.readFileSync('create_project_sites_table.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ ProjectSites table created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createSitesTable();
