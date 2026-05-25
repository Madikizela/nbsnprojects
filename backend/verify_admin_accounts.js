const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'RLMS',
  password: '12345',
  port: 5432,
});

async function verifyAdminAccounts() {
  try {
    console.log('Verifying admin accounts in both tables...\n');
    
    // Check SystemAdmins table
    const systemAdminResult = await pool.query(`
      SELECT "Id", "Name", "Email", "CreatedAt", "UpdatedAt" 
      FROM "SystemAdmins" 
      WHERE "Email" = 'admin@system.local';
    `);
    
    console.log('=== SystemAdmins Table ===');
    if (systemAdminResult.rows.length > 0) {
      console.log('✓ Admin found in SystemAdmins table:');
      console.log(systemAdminResult.rows[0]);
    } else {
      console.log('✗ Admin NOT found in SystemAdmins table');
    }
    
    // Check Users table
    const userResult = await pool.query(`
      SELECT "Id", "Name", "Email", "Role", "Status", "ClientId", "CreatedAt", "UpdatedAt" 
      FROM "Users" 
      WHERE "Email" = 'admin@system.local';
    `);
    
    console.log('\n=== Users Table ===');
    if (userResult.rows.length > 0) {
      console.log('✓ Admin found in Users table:');
      console.log(userResult.rows[0]);
    } else {
      console.log('✗ Admin NOT found in Users table');
    }
    
    // Show all tables and their record counts
    console.log('\n=== Database Overview ===');
    const tables = ['Clients', 'SystemAdmins', 'SkillsDevelopmentProviders', 'Departments', 'Users'];
    
    for (const table of tables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM "${table}";`);
        console.log(`${table}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`${table}: Table not found or error`);
      }
    }
    
  } catch (error) {
    console.error('Error verifying admin accounts:', error);
  } finally {
    await pool.end();
  }
}

verifyAdminAccounts();