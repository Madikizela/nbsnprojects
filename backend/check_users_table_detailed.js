const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkUsersTable() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check table structure
    console.log('\n📋 Users Table Structure:');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check total count
    console.log('\n📊 Users Table Count:');
    const countResult = await client.query('SELECT COUNT(*) as total FROM "Users"');
    console.log(`Total users: ${countResult.rows[0].total}`);
    
    // Check all users if any exist
    if (countResult.rows[0].total > 0) {
      console.log('\n👥 All Users:');
      const usersResult = await client.query(`
        SELECT "Id", "Email", "FirstName", "LastName", "Role", "Status", 
               "ClientId", "SkillsDevelopmentProviderId", "DepartmentId"
        FROM "Users" 
        ORDER BY "Id"
      `);
      
      usersResult.rows.forEach(user => {
        console.log(`ID: ${user.Id}, Email: ${user.Email}, Name: ${user.FirstName} ${user.LastName}, Role: ${user.Role}, Status: ${user.Status}`);
      });
    } else {
      console.log('\n❌ Users table is empty');
    }
    
    // Also check SystemAdmins for comparison
    console.log('\n📊 SystemAdmins Table Count:');
    const adminCountResult = await client.query('SELECT COUNT(*) as total FROM "SystemAdmins"');
    console.log(`Total system admins: ${adminCountResult.rows[0].total}`);
    
    if (adminCountResult.rows[0].total > 0) {
      console.log('\n👑 System Admins:');
      const adminsResult = await client.query(`
        SELECT "Id", "Email", "FirstName", "LastName", "Username", "Status"
        FROM "SystemAdmins" 
        ORDER BY "Id"
      `);
      
      adminsResult.rows.forEach(admin => {
        console.log(`ID: ${admin.Id}, Email: ${admin.Email}, Username: ${admin.Username}, Name: ${admin.FirstName} ${admin.LastName}, Status: ${admin.Status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTable();