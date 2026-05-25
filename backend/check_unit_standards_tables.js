const { Client } = require('pg');

async function checkTables() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking for unit standards related tables...\n');

        // Get all tables related to unit standards
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%unit%' OR table_name LIKE '%standard%')
            ORDER BY table_name
        `);

        console.log('📋 Unit Standards Related Tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        console.log('');

        // Check for project qualification unit standards table
        const pqusResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%project%qualification%unit%'
            ORDER BY table_name
        `);

        if (pqusResult.rows.length > 0) {
            console.log('✅ Found project qualification unit standards table:');
            pqusResult.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            
            // Get schema for this table
            const schemaResult = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [pqusResult.rows[0].table_name]);
            
            console.log('\n   Columns:');
            schemaResult.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
            });
        } else {
            console.log('❌ No project qualification unit standards table found!');
            console.log('   We need to create a table to store selected unit standards.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkTables();
