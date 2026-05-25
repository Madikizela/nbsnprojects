const { Client } = require('pg');

async function checkAdminPassword() {
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

        // Get admin user details
        const result = await client.query('SELECT * FROM "SystemAdmins" LIMIT 1');
        const admin = result.rows[0];
        
        console.log('👤 Admin user details:');
        console.log('ID:', admin.Id);
        console.log('Email:', admin.Email);
        console.log('First Name:', admin.FirstName);
        console.log('Last Name:', admin.LastName);
        console.log('Status:', admin.Status);
        console.log('Access Level:', admin.AccessLevel);
        console.log('Password Hash:', admin.PasswordHash);
        console.log('Created At:', admin.CreatedAt);
        console.log('Updated At:', admin.UpdatedAt);

        // Test different password combinations
        const bcrypt = require('bcryptjs');
        
        const testPasswords = [
            'Admin@123',
            'admin@123',
            'admin123',
            'Admin123',
            'password',
            'admin'
        ];

        console.log('\n🔑 Testing password combinations:');
        for (const password of testPasswords) {
            const isValid = await bcrypt.compare(password, admin.PasswordHash);
            console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        }

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}

checkAdminPassword();