const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function checkUsers() {
    try {
        console.log('✅ Connected to PostgreSQL\n');
        
        // Check all users with their roles
        const usersQuery = `
            SELECT id, email, first_name, last_name, role, status
            FROM "Users"
            ORDER BY id;
        `;
        
        const usersResult = await pool.query(usersQuery);
        console.log(`📋 All Users (${usersResult.rows.length} total):\n`);
        
        usersResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.first_name} ${user.last_name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status}`);
            console.log('');
        });
        
        // Check SystemAdmins
        const adminQuery = `
            SELECT id, email, first_name, last_name, status
            FROM "SystemAdmins"
            ORDER BY id;
        `;
        
        const adminResult = await pool.query(adminQuery);
        console.log(`📋 SystemAdmins (${adminResult.rows.length} total):\n`);
        
        adminResult.rows.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.email}`);
            console.log(`   Name: ${admin.first_name} ${admin.last_name}`);
            console.log(`   Status: ${admin.status}`);
            console.log('');
        });
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
    }
}

checkUsers();
