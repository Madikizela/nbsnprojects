const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'RLMS',
  password: '12345',
  port: 5432,
});

async function createSchemaFixed() {
  try {
    console.log('Working with existing RLMS database...');
    
    // Create Clients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Clients" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(200) NOT NULL,
        "Email" VARCHAR(100) NOT NULL,
        "PhoneNumber" VARCHAR(20),
        "Address" VARCHAR(500),
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    console.log('✓ Created Clients table');

    // Create SystemAdmins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SystemAdmins" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(100) NOT NULL,
        "Email" VARCHAR(100) NOT NULL,
        "PasswordHash" VARCHAR(255) NOT NULL,
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    console.log('✓ Created SystemAdmins table');

    // Create SkillsDevelopmentProviders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SkillsDevelopmentProviders" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(200) NOT NULL,
        "Description" VARCHAR(500),
        "Address" VARCHAR(200),
        "AccreditationNumber" VARCHAR(50),
        "ContactEmail" VARCHAR(100) NOT NULL,
        "ContactPhone" VARCHAR(20),
        "ContactPerson" VARCHAR(100),
        "Status" INTEGER NOT NULL,
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ClientId" INTEGER NOT NULL
      );
    `);
    console.log('✓ Created SkillsDevelopmentProviders table');

    // Create Departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Departments" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(200) NOT NULL,
        "Description" VARCHAR(500),
        "SkillsDevelopmentProviderId" INTEGER NOT NULL,
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    console.log('✓ Created Departments table');

    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(100) NOT NULL,
        "Email" VARCHAR(100) NOT NULL,
        "PasswordHash" VARCHAR(255) NOT NULL,
        "Role" INTEGER NOT NULL,
        "Status" INTEGER NOT NULL,
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ClientId" INTEGER,
        "SkillsDevelopmentProviderId" INTEGER,
        "DepartmentId" INTEGER
      );
    `);
    console.log('✓ Created Users table');

    // Create indexes
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_Clients_Email" ON "Clients" ("Email");`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_SystemAdmins_Email" ON "SystemAdmins" ("Email");`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_AccreditationNumber" ON "SkillsDevelopmentProviders" ("AccreditationNumber");`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_ContactEmail" ON "SkillsDevelopmentProviders" ("ContactEmail");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IX_SkillsDevelopmentProviders_ClientId" ON "SkillsDevelopmentProviders" ("ClientId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IX_Departments_SkillsDevelopmentProviderId" ON "Departments" ("SkillsDevelopmentProviderId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IX_Users_ClientId" ON "Users" ("ClientId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IX_Users_SkillsDevelopmentProviderId" ON "Users" ("SkillsDevelopmentProviderId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IX_Users_DepartmentId" ON "Users" ("DepartmentId");`);
    console.log('✓ Created indexes');

    // Add foreign key constraints (check if they exist first)
    try {
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_SkillsDevelopmentProviders_Clients_ClientId') THEN
            ALTER TABLE "SkillsDevelopmentProviders" 
            ADD CONSTRAINT "FK_SkillsDevelopmentProviders_Clients_ClientId" 
            FOREIGN KEY ("ClientId") REFERENCES "Clients" ("Id") ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Departments_SkillsDevelopmentProviders_SkillsDevelopmentProviderId') THEN
            ALTER TABLE "Departments" 
            ADD CONSTRAINT "FK_Departments_SkillsDevelopmentProviders_SkillsDevelopmentProviderId" 
            FOREIGN KEY ("SkillsDevelopmentProviderId") REFERENCES "SkillsDevelopmentProviders" ("Id") ON DELETE CASCADE;
          END IF;
        END $$;
      `);
      
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Users_Clients_ClientId') THEN
            ALTER TABLE "Users" 
            ADD CONSTRAINT "FK_Users_Clients_ClientId" 
            FOREIGN KEY ("ClientId") REFERENCES "Clients" ("Id");
          END IF;
        END $$;
      `);
      
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Users_SkillsDevelopmentProviders_SkillsDevelopmentProviderId') THEN
            ALTER TABLE "Users" 
            ADD CONSTRAINT "FK_Users_SkillsDevelopmentProviders_SkillsDevelopmentProviderId" 
            FOREIGN KEY ("SkillsDevelopmentProviderId") REFERENCES "SkillsDevelopmentProviders" ("Id");
          END IF;
        END $$;
      `);
      
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Users_Departments_DepartmentId') THEN
            ALTER TABLE "Users" 
            ADD CONSTRAINT "FK_Users_Departments_DepartmentId" 
            FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id");
          END IF;
        END $$;
      `);
      console.log('✓ Created foreign key constraints');
    } catch (fkError) {
      console.log('Note: Some foreign key constraints may already exist');
    }

    // Create a default client
    const clientResult = await pool.query(`
      INSERT INTO "Clients" ("Name", "Email", "PhoneNumber", "Address", "CreatedAt", "UpdatedAt")
      VALUES ('Default Client', 'client@system.local', '123-456-7890', 'Default Address', NOW(), NOW())
      ON CONFLICT ("Email") DO NOTHING
      RETURNING "Id";
    `);
    
    let clientId = 1;
    if (clientResult.rows.length > 0) {
      clientId = clientResult.rows[0].Id;
      console.log('✓ Created default client with ID:', clientId);
    } else {
      // Get existing client ID
      const existingClient = await pool.query(`SELECT "Id" FROM "Clients" WHERE "Email" = 'client@system.local';`);
      if (existingClient.rows.length > 0) {
        clientId = existingClient.rows[0].Id;
        console.log('✓ Using existing client with ID:', clientId);
      }
    }

    // Create system admin user
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await pool.query(`
      INSERT INTO "SystemAdmins" ("Name", "Email", "PasswordHash", "CreatedAt", "UpdatedAt")
      VALUES ('System Administrator', 'admin@system.local', $1, NOW(), NOW())
      ON CONFLICT ("Email") DO UPDATE SET 
        "PasswordHash" = EXCLUDED."PasswordHash",
        "UpdatedAt" = NOW();
    `, [hashedPassword]);
    console.log('✓ Created/updated system admin');

    // Create corresponding user record for the admin
    await pool.query(`
      INSERT INTO "Users" ("Name", "Email", "PasswordHash", "Role", "Status", "CreatedAt", "UpdatedAt", "ClientId")
      VALUES ('System Administrator', 'admin@system.local', $1, 0, 1, NOW(), NOW(), $2)
      ON CONFLICT ("Email") DO UPDATE SET 
        "PasswordHash" = EXCLUDED."PasswordHash",
        "UpdatedAt" = NOW();
    `, [hashedPassword, clientId]);
    console.log('✓ Created/updated admin user record');

    console.log('\n=== Database Schema Setup Complete ===');
    console.log('Admin Credentials:');
    console.log('Email: admin@system.local');
    console.log('Password: Admin@123');
    
  } catch (error) {
    console.error('Error creating schema:', error);
  } finally {
    await pool.end();
  }
}

createSchemaFixed();