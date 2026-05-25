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
        console.log('🔍 Creating Assessment Tables...\n');

        const sql = fs.readFileSync('create_assessment_tables.sql', 'utf8');
        await client.query(sql);

        console.log('✅ Tables created successfully!\n');

        // Verify tables were created
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('AssessmentTypes', 'UnitStandardAssessments', 'AssessmentQuestions')
            ORDER BY table_name
        `);

        console.log('📋 Created Tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });
        console.log('');

        // Verify assessment types were inserted
        const typesResult = await client.query(`
            SELECT "Id", "Name", "Description"
            FROM "AssessmentTypes"
            ORDER BY "Id"
        `);

        console.log('📊 Assessment Types:');
        typesResult.rows.forEach(type => {
            console.log(`   ${type.Id}. ${type.Name} - ${type.Description}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

createTables();
