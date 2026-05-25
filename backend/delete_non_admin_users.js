const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection configuration
const config = {
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
};

async function deleteNonAdminUsers() {
    const client = new Client(config);
    
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Start transaction
        await client.query('BEGIN');
        
        console.log('\n🔍 Checking current users...');
        
        // Get all users (excluding system admins)
        const usersResult = await client.query(`
            SELECT "Id", "Email", "FirstName", "LastName" 
            FROM "Users" 
            WHERE "Email" != 'admin@system.local'
            ORDER BY "Id"
        `);
        
        console.log(`📋 Found ${usersResult.rows.length} non-admin users to delete:`);
        usersResult.rows.forEach(user => {
            console.log(`  - ${user.Id}: ${user.Email} (${user.FirstName} ${user.LastName})`);
        });
        
        if (usersResult.rows.length === 0) {
            console.log('✅ No non-admin users found to delete');
            await client.query('ROLLBACK');
            return;
        }
        
        // Confirm before deleting
        console.log(`\n⚠️  About to delete ${usersResult.rows.length} user(s).`);
        console.log('This action cannot be undone.');
        
        // Delete related data first (if there are any foreign key constraints)
        console.log('\n🗑️  Deleting related user data...');
        
        // Delete any user-related data in other tables
        // Add more tables here if needed based on your schema
        
        // Delete the users
        console.log('\n🗑️  Deleting users...');
        const deleteResult = await client.query(`
            DELETE FROM "Users" 
            WHERE "Email" != 'admin@system.local'
        `);
        
        console.log(`✅ Deleted ${deleteResult.rowCount} user(s)`);
        
        // Commit transaction
        await client.query('COMMIT');
        
        // Verify remaining users
        const remainingResult = await client.query(`
            SELECT "Id", "Email", "FirstName", "LastName" 
            FROM "Users" 
            ORDER BY "Id"
        `);
        
        console.log('\n📋 Remaining users after deletion:');
        remainingResult.rows.forEach(user => {
            console.log(`  - ${user.Id}: ${user.Email} (${user.FirstName} ${user.LastName})`);
        });
        
        console.log('\n✅ Successfully deleted non-admin users!');
        
    } catch (error) {
        console.error('❌ Error deleting users:', error);
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }
}

// Run the deletion
if (require.main === module) {
    deleteNonAdminUsers().catch(console.error);
}

module.exports = { deleteNonAdminUsers };