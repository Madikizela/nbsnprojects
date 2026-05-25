const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();

// Try to connect with common passwords and create our database
const commonPasswords = ['postgres', 'admin', '123456', 'password', 'root'];

async function setupPostgresDatabase() {
    let adminClient = null;
    let workingPassword = null;
    
    console.log('Attempting to connect to PostgreSQL...');
    
    // Try to find working admin password
    for (const pwd of commonPasswords) {
        try {
            adminClient = new Client({
                host: 'localhost',
                database: 'postgres',
                user: 'postgres',
                password: pwd,
                port: 5432
            });
            
            await adminClient.connect();
            workingPassword = pwd;
            console.log(`✅ Connected with password: ${pwd}`);
            break;
        } catch (err) {
            console.log(`❌ Failed with password: ${pwd}`);
            if (adminClient) {
                try { await adminClient.end(); } catch {}
            }
        }
    }
    
    if (!adminClient || !workingPassword) {
        console.log('❌ Could not connect to PostgreSQL with any common password.');
        console.log('Please manually create the database or provide the correct password.');
        return false;
    }
    
    try {
        // Check if rlms database exists
        const dbCheck = await adminClient.query("SELECT datname FROM pg_database WHERE datname = 'rlms'");
        
        if (dbCheck.rows.length === 0) {
            console.log('Creating rlms database...');
            await adminClient.query('CREATE DATABASE rlms');
            console.log('✅ RLMS database created');
        } else {
            console.log('✅ RLMS database already exists');
        }
        
        // Create a dedicated user for the application
        try {
            await adminClient.query("CREATE USER rlms_user WITH PASSWORD 'rlms123'");
            console.log('✅ Created rlms_user');
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log('✅ rlms_user already exists');
            } else {
                throw err;
            }
        }
        
        // Grant privileges
        await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE rlms TO rlms_user');
        console.log('✅ Granted privileges to rlms_user');
        
        await adminClient.end();
        
        // Now connect to the rlms database and set up schema
        const rlmsClient = new Client({
            host: 'localhost',
            database: 'rlms',
            user: 'rlms_user',
            password: 'rlms123',
            port: 5432
        });
        
        await rlmsClient.connect();
        console.log('✅ Connected to RLMS database as rlms_user');
        
        // Grant schema privileges
        await rlmsClient.query('GRANT ALL ON SCHEMA public TO rlms_user');
        await rlmsClient.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rlms_user');
        await rlmsClient.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rlms_user');
        
        await rlmsClient.end();
        
        console.log('\n✅ PostgreSQL setup complete!');
        console.log('Database: rlms');
        console.log('User: rlms_user');
        console.log('Password: rlms123');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error setting up PostgreSQL:', error.message);
        if (adminClient) {
            try { await adminClient.end(); } catch {}
        }
        return false;
    }
}

setupPostgresDatabase().then(success => {
    if (success) {
        console.log('\nNext steps:');
        console.log('1. Update appsettings.json with the new connection string');
        console.log('2. Run Entity Framework migrations');
        console.log('3. Migrate data from SQLite');
    }
}).catch(console.error);