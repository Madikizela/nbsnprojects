const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();

async function createPostgresDatabase() {
    // First, connect to PostgreSQL to create the database
    const adminClient = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'postgres' // Connect to default database first
    });

    try {
        await adminClient.connect();
        console.log('✓ Connected to PostgreSQL');

        // Check if database exists
        const dbCheckResult = await adminClient.query(
            "SELECT 1 FROM pg_database WHERE datname = 'skills_development'"
        );

        if (dbCheckResult.rows.length === 0) {
            // Create the database
            await adminClient.query('CREATE DATABASE skills_development');
            console.log('✓ Created skills_development database');
        } else {
            console.log('✓ Database skills_development already exists');
        }

        await adminClient.end();

        // Now connect to the new database
        const dbClient = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'postgres',
            database: 'skills_development'
        });

        await dbClient.connect();
        console.log('✓ Connected to skills_development database');

        // Create SystemAdmins table
        await dbClient.query(`
            CREATE TABLE IF NOT EXISTS "SystemAdmins" (
                "Id" SERIAL PRIMARY KEY,
                "FirstName" VARCHAR(100),
                "LastName" VARCHAR(100),
                "Username" VARCHAR(50) UNIQUE NOT NULL,
                "Email" VARCHAR(100) UNIQUE NOT NULL,
                "PasswordHash" TEXT NOT NULL,
                "PhoneNumber" VARCHAR(20),
                "Status" INTEGER NOT NULL DEFAULT 1,
                "AccessLevel" INTEGER NOT NULL DEFAULT 1,
                "LastLoginAt" TIMESTAMP,
                "LoginAttempts" INTEGER NOT NULL DEFAULT 0,
                "LockedUntil" TIMESTAMP,
                "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Created SystemAdmins table');

        // Migrate data from SQLite
        const sqliteDb = new sqlite3.Database('skills_development.db');
        
        const sqliteData = await new Promise((resolve, reject) => {
            sqliteDb.get(
                "SELECT * FROM SystemAdmins WHERE Email = 'admin@system.local'",
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (sqliteData) {
            // Insert the admin user into PostgreSQL
            await dbClient.query(`
                INSERT INTO "SystemAdmins" 
                ("FirstName", "LastName", "Username", "Email", "PasswordHash", "PhoneNumber", "Status", "AccessLevel", "CreatedAt", "UpdatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT ("Email") DO NOTHING
            `, [
                sqliteData.FirstName,
                sqliteData.LastName,
                sqliteData.Username,
                sqliteData.Email,
                sqliteData.PasswordHash,
                sqliteData.PhoneNumber,
                sqliteData.Status,
                sqliteData.AccessLevel,
                new Date(sqliteData.CreatedAt),
                new Date(sqliteData.UpdatedAt)
            ]);
            console.log('✓ Migrated admin user to PostgreSQL');
        }

        sqliteDb.close();
        await dbClient.end();
        console.log('✓ Database setup complete');

    } catch (error) {
        console.error('Error setting up PostgreSQL database:', error);
        process.exit(1);
    }
}

createPostgresDatabase();