const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function runSignatureMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const sqlPath = path.join(__dirname, 'add_signature_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('✅ SignaturePath column added successfully');
    
    // Create uploads/signatures directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads', 'signatures');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`✅ Created directory: ${uploadsDir}`);
    } else {
      console.log(`ℹ️ Directory already exists: ${uploadsDir}`);
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runSignatureMigration();
