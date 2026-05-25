const { Client } = require('pg');
const fs = require('fs');

async function createTables() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Creating assessment tables...\n');

        const sql = fs.readFileSync('create_assessment_tables.sql', 'utf8');
        await client.query(sql);

        console.log('✅ Assessment tables created successfully!\n');

        // Verify tables were created
        const tables = ['FormativeAssessments', 'SummativeAssessments', 'LogbookEntries'];
        
        for (const table of tables) {
            const result = await client.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            
            console.log(`📋 ${table}:`);
            result.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type})`);
            });
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

createTables();
