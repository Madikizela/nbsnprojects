const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkUsersTableStructure() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check Users table structure
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Users' 
      ORDER BY ordinal_position;
    `);
    
    if (usersStructure.rows.length === 0) {
      console.log('❌ Users table not found. Checking for lowercase table name...');
      
      const usersStructureLower = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position;
      `);
      
      if (usersStructureLower.rows.length > 0) {
        console.log('✅ Found users table (lowercase):');
        usersStructureLower.rows.forEach(row => {
          console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
        });
      } else {
        console.log('❌ No users table found');
      }
    } else {
      console.log('✅ Found Users table:');
      usersStructure.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
      });
    }

    // Try to get some sample users
    console.log('\n=== SAMPLE USERS ===');
    try {
      const sampleUsers = await client.query('SELECT * FROM "Users" LIMIT 5');
      console.log(`Found ${sampleUsers.rows.length} users in Users table`);
      sampleUsers.rows.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        Object.keys(user).forEach(key => {
          console.log(`   ${key}: ${user[key]}`);
        });
      });
    } catch (error) {
      console.log('Error querying Users table:', error.message);
      
      // Try lowercase
      try {
        const sampleUsersLower = await client.query('SELECT * FROM users LIMIT 5');
        console.log(`Found ${sampleUsersLower.rows.length} users in users table`);
        sampleUsersLower.rows.forEach((user, index) => {
          console.log(`\nUser ${index + 1}:`);
          Object.keys(user).forEach(key => {
            console.log(`   ${key}: ${user[key]}`);
          });
        });
      } catch (error2) {
        console.log('Error querying users table:', error2.message);
      }
    }

  } catch (error) {
    console.error('Error checking users table structure:', error);
  } finally {
    await client.end();
  }
}

checkUsersTableStructure();