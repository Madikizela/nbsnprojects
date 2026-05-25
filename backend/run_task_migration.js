const { Client } = require('pg');
const fs = require('fs');

async function runTaskMigration() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Connected to database...');

        // Read the SQL script
        const sql = fs.readFileSync('create_task_tables.sql', 'utf8');
        
        // Execute the SQL script
        await client.query(sql);
        
        console.log('✅ Task tables created successfully!');
        
        // Verify tables were created
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('Tasks', 'TaskReminders')
            ORDER BY table_name
        `);
        
        console.log('📋 Created tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
    }
}

runTaskMigration();