const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        host: 'localhost', database: 'nbsnproject',
        user: 'postgres', password: 'postgres', port: 5432,
    });
    try {
        await client.connect();
        
        // Check if table exists and its columns
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'LearningMaterials'
            ORDER BY ordinal_position
        `);
        
        if (result.rowCount === 0) {
            console.log('❌ Table "LearningMaterials" does not exist!');
            // Check for lowercase variant
            const lower = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name ILIKE 'learningmaterials'`);
            console.log('Tables matching "learningmaterials":', lower.rows);
        } else {
            console.log(`✅ Table "LearningMaterials" exists with ${result.rowCount} columns:`);
            result.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));
        }

        // Check if ProjectQualificationId column exists
        const colCheck = result.rows.find(r => r.column_name === 'ProjectQualificationId');
        if (colCheck) {
            console.log('\n✅ ProjectQualificationId column EXISTS');
        } else {
            console.log('\n❌ ProjectQualificationId column MISSING — needs migration!');
            // Add the column
            console.log('\n🔧 Adding ProjectQualificationId column...');
            await client.query(`ALTER TABLE "LearningMaterials" ADD COLUMN IF NOT EXISTS "ProjectQualificationId" INTEGER REFERENCES "ProjectQualifications"("Id")`);
            console.log('✅ Column added successfully!');
        }

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}
checkSchema();
