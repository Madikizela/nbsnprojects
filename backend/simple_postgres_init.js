const { Client } = require('pg');

async function initializeDatabase() {
    console.log('Starting PostgreSQL initialization...');
    
    // Try different common PostgreSQL configurations
    const configs = [
        { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: '' },
        { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: 'postgres' },
        { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: 'password' },
        { host: 'localhost', port: 5432, database: 'postgres', user: 'postgres', password: 'root' }
    ];
    
    let client;
    let connectedConfig;
    
    // Try to connect with different configurations
    for (const config of configs) {
        try {
            console.log(`Trying to connect with user: ${config.user}, password: ${config.password || 'empty'}`);
            client = new Client(config);
            await client.connect();
            connectedConfig = config;
            console.log('✅ Successfully connected to PostgreSQL!');
            break;
        } catch (error) {
            console.log(`❌ Failed with config: ${error.message}`);
            continue;
        }
    }
    
    if (!client) {
        console.error('❌ Could not connect to PostgreSQL with any of the common configurations');
        console.log('\nPlease provide your PostgreSQL connection details:');
        console.log('- Host: (usually localhost)');
        console.log('- Port: (usually 5432)');
        console.log('- Username:');
        console.log('- Password:');
        console.log('- Database name: (usually postgres for system database)');
        return;
    }
    
    try {
        // Check if skills_development database exists
        const dbResult = await client.query(
            "SELECT datname FROM pg_database WHERE datname = 'skills_development'"
        );
        
        if (dbResult.rows.length === 0) {
            console.log('Creating skills_development database...');
            await client.query('CREATE DATABASE skills_development');
            console.log('✅ Database created successfully');
        } else {
            console.log('✅ skills_development database already exists');
        }
        
        // Connect to the skills_development database
        await client.end();
        
        const skillsConfig = { ...connectedConfig, database: 'skills_development' };
        const skillsClient = new Client(skillsConfig);
        await skillsClient.connect();
        console.log('✅ Connected to skills_development database');
        
        // Create basic tables
        const createTablesSQL = `
            CREATE TABLE IF NOT EXISTS "Users" (
                "Id" SERIAL PRIMARY KEY,
                "FirstName" VARCHAR(100) NOT NULL,
                "LastName" VARCHAR(100) NOT NULL,
                "Email" VARCHAR(255) NOT NULL UNIQUE,
                "PasswordHash" VARCHAR(255) NOT NULL,
                "Phone" VARCHAR(50),
                "Role" INTEGER NOT NULL DEFAULT 0,
                "Status" INTEGER NOT NULL DEFAULT 1,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS "SystemAdmins" (
                "Id" SERIAL PRIMARY KEY,
                "Username" VARCHAR(100) NOT NULL UNIQUE,
                "Email" VARCHAR(255) NOT NULL UNIQUE,
                "PasswordHash" VARCHAR(255) NOT NULL,
                "FirstName" VARCHAR(100) NOT NULL,
                "LastName" VARCHAR(100) NOT NULL,
                "Status" INTEGER NOT NULL DEFAULT 1,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS "OccupationalQualifications" (
                "Id" SERIAL PRIMARY KEY,
                "QualificationId" INTEGER NOT NULL,
                "QualificationName" VARCHAR(500) NOT NULL,
                "SaqaQualificationId" INTEGER,
                "QualificationType" VARCHAR(100),
                "NqfLevel" INTEGER,
                "Credits" INTEGER,
                "Status" INTEGER NOT NULL DEFAULT 1,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS "LegacyQualifications" (
                "Id" SERIAL PRIMARY KEY,
                "QualificationId" INTEGER NOT NULL,
                "QualificationName" VARCHAR(500) NOT NULL,
                "SaqaQualificationId" INTEGER,
                "QualificationType" VARCHAR(100),
                "NqfLevel" INTEGER,
                "Credits" INTEGER,
                "Status" INTEGER NOT NULL DEFAULT 1,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS "OccupationalUnitStandards" (
                "Id" SERIAL PRIMARY KEY,
                "QualificationId" INTEGER NOT NULL,
                "ModuleCode" VARCHAR(100) NOT NULL,
                "UnitStandardName" VARCHAR(500) NOT NULL,
                "ModuleType" VARCHAR(100),
                "Level" INTEGER,
                "Credits" INTEGER,
                "Status" INTEGER NOT NULL DEFAULT 1,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS "LegacyUnitStandards" (
                "Id" SERIAL PRIMARY KEY,
                "QualificationId" INTEGER NOT NULL,
                "UnitStandardId" INTEGER NOT NULL,
                "UnitStandardName" VARCHAR(500) NOT NULL,
                "Credits" INTEGER,
                "NqfLevel" INTEGER,
                "Status" INTEGER NOT NULL DEFAULT 1,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Insert default admin user
            INSERT INTO "SystemAdmins" ("Username", "Email", "PasswordHash", "FirstName", "LastName", "Status", "CreatedAt", "UpdatedAt")
            VALUES ('admin', 'admin@system.com', '$2a$11$XlfnpM8l7jJ7lwM3uZ9y4O7z5wD6x8y9z0a1b2c3d4e5f6g7h8i9j0k', 'System', 'Administrator', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT ("Email") DO NOTHING;
            
            -- Insert test user
            INSERT INTO "Users" ("FirstName", "LastName", "Email", "PasswordHash", "Phone", "Role", "Status", "CreatedAt", "UpdatedAt")
            VALUES ('Test', 'User', 'test@example.com', '$2a$11$XlfnpM8l7jJ7lwM3uZ9y4O7z5wD6x8y9z0a1b2c3d4e5f6g7h8i9j0k', '1234567890', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT ("Email") DO NOTHING;
        `;
        
        await skillsClient.query(createTablesSQL);
        console.log('✅ Basic tables created successfully');
        
        await skillsClient.end();
        console.log('\n🎉 PostgreSQL database initialization completed!');
        console.log('\nYou can now start your backend application.');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error.message);
    }
}

initializeDatabase().catch(console.error);