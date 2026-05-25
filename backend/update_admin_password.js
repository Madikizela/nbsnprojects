const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
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

        // Generate new password hash
        const newPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        console.log(`🔑 Setting admin password to: ${newPassword}`);
        console.log(`📝 New hash: ${hashedPassword}`);

        // Update the admin password
        const updateQuery = 'UPDATE "SystemAdmins" SET "PasswordHash" = $1, "UpdatedAt" = $2 WHERE "Email" = $3';
        const result = await client.query(updateQuery, [hashedPassword, new Date(), 'admin@system.local']);
        
        console.log(`✅ Password updated for admin@system.local`);
        console.log(`📊 Rows affected: ${result.rowCount}`);

        // Verify the update
        const verifyQuery = 'SELECT * FROM "SystemAdmins" WHERE "Email" = $1';
        const verifyResult = await client.query(verifyQuery, ['admin@system.local']);
        const updatedAdmin = verifyResult.rows[0];
        
        console.log('🔍 Verification:');
        console.log('Email:', updatedAdmin.Email);
        console.log('New hash:', updatedAdmin.PasswordHash);
        
        // Test the new password
        const isValid = await bcrypt.compare(newPassword, updatedAdmin.PasswordHash);
        console.log('✅ Password verification:', isValid);

        await client.end();
        
        console.log('\n🎉 Admin password successfully updated!');
        console.log('📧 Email: admin@system.local');
        console.log('🔑 Password: Admin@123');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}

updateAdminPassword();