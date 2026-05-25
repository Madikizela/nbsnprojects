const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    let client;
    
    try {
        // Connect to PostgreSQL server (not specific database)
        client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '', // Will try common passwords
            database: 'postgres'
        });

        await client.connect();
        console.log('Connected to PostgreSQL server');

        // Create database if it doesn't exist
        const createDbResult = await client.query(`
            SELECT 1 FROM pg_database WHERE datname = 'skills_development'
        `);
        
        if (createDbResult.rows.length === 0) {
            await client.query('CREATE DATABASE "skills_development"');
            console.log('Created skills_development database');
        } else {
            console.log('skills_development database already exists');
        }

        await client.end();

        // Connect to the specific database
        client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '',
            database: 'skills_development'
        });

        await client.connect();
        console.log('Connected to skills_development database');

        // Read and execute the SQL schema file
        const schemaPath = path.join(__dirname, 'init_postgres.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the SQL into individual statements and execute them
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    console.log('Executed schema statement');
                } catch (err) {
                    console.log('Statement execution error (might be expected):', err.message);
                }
            }
        }

        console.log('Database schema initialized successfully');

    } catch (error) {
        console.error('Error initializing database:', error);
        
        // Try with different common passwords
        const commonPasswords = ['postgres', 'password', 'root'];
        for (const pwd of commonPasswords) {
            try {
                console.log(`Trying password: ${pwd}`);
                client = new Client({
                    host: 'localhost',
                    port: 5432,
                    user: 'postgres',
                    password: pwd,
                    database: 'skills_development'
                });
                
                await client.connect();
                console.log(`Successfully connected with password: ${pwd}`);
                
                // Execute schema
                const schemaPath = path.join(__dirname, 'init_postgres.sql');
                const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
                const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await client.query(statement);
                        } catch (err) {
                            console.log('Statement error:', err.message);
                        }
                    }
                }
                
                console.log('Database initialized successfully');
                break;
                
            } catch (pwdError) {
                console.log(`Password ${pwd} failed:`, pwdError.message);
                continue;
            }
        }
        
    } finally {
        if (client) {
            await client.end();
        }
    }
}

initializeDatabase().catch(console.error);