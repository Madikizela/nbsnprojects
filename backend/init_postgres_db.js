const { Client } = require('pg');

// PostgreSQL connection configuration (connect to postgres database first)
const pgConfig = {
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default postgres database
    user: 'postgres',
    password: 'postgres'
};

async function initializeDatabase() {
    console.log('Initializing PostgreSQL database...');
    
    const client = new Client(pgConfig);
    
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');
        
        // Create the skills_development database
        try {
            await client.query('CREATE DATABASE skills_development');
            console.log('Database "skills_development" created successfully');
        } catch (error) {
            if (error.code === '42P04') {
                console.log('Database "skills_development" already exists');
            } else {
                throw error;
            }
        }
        
        // Connect to the new database
        await client.end();
        
        // Update connection to use the new database
        pgConfig.database = 'skills_development';
        const skillsClient = new Client(pgConfig);
        await skillsClient.connect();
        console.log('Connected to skills_development database');
        
        // Read and execute the initialization SQL script
        const fs = require('fs');
        const path = require('path');
        const sqlScript = fs.readFileSync(path.join(__dirname, 'init_postgres.sql'), 'utf8');
        
        // Split the script into individual statements and execute them
        const statements = sqlScript.split(';').filter(stmt => stmt.trim());
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    await skillsClient.query(statement);
                    console.log(`Executed statement ${i + 1} successfully`);
                } catch (error) {
                    console.error(`Error executing statement ${i + 1}:`, error.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                    // Continue with other statements
                }
            }
        }
        
        console.log('\nDatabase initialization completed successfully!');
        
        await skillsClient.end();
        
    } catch (error) {
        console.error('Database initialization failed:', error);
        await client.end();
        process.exit(1);
    }
}

// Run initialization
initializeDatabase().catch(console.error);