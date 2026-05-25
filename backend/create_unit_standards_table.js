const { Client } = require('pg');
const fs = require('fs');

async function createTable() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Creating ProjectQualificationUnitStandards table...\n');

        const sql = fs.readFileSync('create_project_qualification_unit_standards_table.sql', 'utf8');
        await client.query(sql);

        console.log('✅ Table created successfully!\n');

        // Verify the table was created
        const verifyResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'ProjectQualificationUnitStandards'
            ORDER BY ordinal_position
        `);

        console.log('📋 Table Structure:');
        verifyResult.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

createTable();
