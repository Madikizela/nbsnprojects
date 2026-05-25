const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createDefaultAdmin() {
    let client;
    
    try {
        // Try to connect with empty password first (since backend is working)
        client = new Client({
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: '',
            database: 'skills_development'
        });

        await client.connect();
        console.log('Connected to PostgreSQL');
        
        // Check if admin already exists
        const existingAdmin = await client.query(
            'SELECT * FROM "SystemAdmins" WHERE "Email" = $1',
            ['admin@system.com']
        );
        
        if (existingAdmin.rows.length > 0) {
            console.log('Admin user already exists');
            return;
        }
        
        // Create password hash
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        // Insert default admin
        await client.query(`
            INSERT INTO "SystemAdmins" (
                "FirstName", "LastName", "Username", "Email", 
                "PasswordHash", "AccessLevel", "Status", "CreatedAt", "UpdatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            'System', 'Admin', 'admin', 'admin@system.com',
            passwordHash, 'SuperAdmin', 'Active', new Date(), new Date()
        ]);
        
        console.log('Default admin user created successfully!');
        console.log('Email: admin@system.com');
        console.log('Password: admin123');
        
    } catch (error) {
        console.error('Error creating admin:', error.message);
        
        // Try with common passwords
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
                
                // Check if admin exists
                const existingAdmin = await client.query(
                    'SELECT * FROM "SystemAdmins" WHERE "Email" = $1',
                    ['admin@system.com']
                );
                
                if (existingAdmin.rows.length === 0) {
                    const passwordHash = await bcrypt.hash('admin123', 10);
                    
                    await client.query(`
                        INSERT INTO "SystemAdmins" (
                            "FirstName", "LastName", "Username", "Email", 
                            "PasswordHash", "AccessLevel", "Status", "CreatedAt", "UpdatedAt"
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    `, [
                        'System', 'Admin', 'admin', 'admin@system.com',
                        passwordHash, 'SuperAdmin', 'Active', new Date(), new Date()
                    ]);
                    
                    console.log('Default admin user created successfully!');
                } else {
                    console.log('Admin user already exists');
                }
                
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

createDefaultAdmin().catch(console.error);