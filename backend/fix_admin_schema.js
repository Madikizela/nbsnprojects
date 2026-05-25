const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'RLMS',
  password: '12345',
  port: 5432,
});

async function fixAdminSchema() {
  try {
    console.log('Fixing SystemAdmins table structure...\n');
    
    // Drop and recreate SystemAdmins table with correct structure
    await pool.query(`DROP TABLE IF EXISTS "SystemAdmins" CASCADE;`);
    console.log('✓ Dropped existing SystemAdmins table');
    
    // Create SystemAdmins table with correct structure matching the C# model
    await pool.query(`
      CREATE TABLE "SystemAdmins" (
        "Id" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(100) NOT NULL,
        "LastName" VARCHAR(100) NOT NULL,
        "Username" VARCHAR(50) NOT NULL,
        "Email" VARCHAR(255) NOT NULL,
        "PasswordHash" VARCHAR(255) NOT NULL,
        "PhoneNumber" VARCHAR(20),
        "Status" INTEGER NOT NULL DEFAULT 0,
        "AccessLevel" INTEGER NOT NULL DEFAULT 1,
        "LastLoginAt" TIMESTAMP WITH TIME ZONE,
        "LoginAttempts" INTEGER NOT NULL DEFAULT 0,
        "LockedUntil" TIMESTAMP WITH TIME ZONE,
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Created SystemAdmins table with correct structure');

    // Create indexes
    await pool.query(`CREATE UNIQUE INDEX "IX_SystemAdmins_Email" ON "SystemAdmins" ("Email");`);
    await pool.query(`CREATE UNIQUE INDEX "IX_SystemAdmins_Username" ON "SystemAdmins" ("Username");`);
    await pool.query(`CREATE INDEX "IX_SystemAdmins_Status" ON "SystemAdmins" ("Status");`);
    await pool.query(`CREATE INDEX "IX_SystemAdmins_AccessLevel" ON "SystemAdmins" ("AccessLevel");`);
    console.log('✓ Created indexes for SystemAdmins table');

    // Create system admin user with proper structure
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await pool.query(`
      INSERT INTO "SystemAdmins" (
        "FirstName", "LastName", "Username", "Email", "PasswordHash", 
        "PhoneNumber", "Status", "AccessLevel", "CreatedAt", "UpdatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW());
    `, [
      'System', 
      'Administrator', 
      'admin@system.local', 
      'admin@system.local', 
      hashedPassword,
      '+1-000-000-0000',
      0, // Active status
      1  // Admin access level
    ]);
    console.log('✓ Created system admin user');

    // Verify the admin user
    const adminResult = await pool.query(`
      SELECT "Id", "FirstName", "LastName", "Username", "Email", "Status", "AccessLevel", "CreatedAt"
      FROM "SystemAdmins" 
      WHERE "Email" = 'admin@system.local';
    `);
    
    if (adminResult.rows.length > 0) {
      console.log('\n=== System Admin Created Successfully ===');
      console.log(adminResult.rows[0]);
      console.log('\nLogin Credentials:');
      console.log('Email: admin@system.local');
      console.log('Password: Admin@123');
    }

    // Show table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'SystemAdmins' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== SystemAdmins Table Structure ===');
    tableInfo.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error fixing admin schema:', error);
  } finally {
    await pool.end();
  }
}

fixAdminSchema();