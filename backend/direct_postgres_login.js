const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testDirectPostgreSQLLogin() {
    const client = new Client({
        host: 'localhost',
        database: 'rlms',
        user: 'postgres',
        password: '12345',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Check if SystemAdmins table exists and has data
        const adminCheck = await client.query('SELECT COUNT(*) as count FROM "SystemAdmins"');
        console.log(`📊 SystemAdmins table has ${adminCheck.rows[0].count} records`);

        if (adminCheck.rows[0].count > 0) {
            // Get first admin user
            const adminResult = await client.query('SELECT * FROM "SystemAdmins" LIMIT 1');
            const admin = adminResult.rows[0];
            console.log('👤 Found admin user:', {
                id: admin.Id,
                email: admin.Email,
                firstName: admin.FirstName,
                lastName: admin.LastName,
                status: admin.Status
            });

            // Test password verification (if password is available)
            if (admin.PasswordHash) {
                console.log('🔑 Admin has password hash, login should work');
            } else {
                console.log('⚠️  Admin user missing password hash');
            }
        } else {
            console.log('⚠️  No admin users found in SystemAdmins table');
        }

        // Also check Users table
        const userCheck = await client.query('SELECT COUNT(*) as count FROM "Users"');
        console.log(`👥 Users table has ${userCheck.rows[0].count} records`);

        await client.end();
        console.log('✅ PostgreSQL connection test completed successfully');
        
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        if (client) await client.end();
    }
}

testDirectPostgreSQLLogin();