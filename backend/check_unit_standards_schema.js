const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking legacy_unit_standards table schema...\n');

        // Get column information
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'legacy_unit_standards'
            ORDER BY ordinal_position
        `);

        console.log('📋 Columns in legacy_unit_standards:');
        columnsResult.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
        console.log('');

        // Get sample data
        console.log('📊 Sample data from legacy_unit_standards:');
        const sampleResult = await client.query(`
            SELECT * FROM legacy_unit_standards LIMIT 3
        `);
        
        if (sampleResult.rows.length > 0) {
            console.log(JSON.stringify(sampleResult.rows, null, 2));
        } else {
            console.log('   No data found in table');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkSchema();
