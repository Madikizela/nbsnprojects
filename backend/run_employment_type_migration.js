const { Client } = require('pg');
const fs = require('fs');

async function runEmploymentTypeMigration() {
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
        const sql = fs.readFileSync('add_employment_type_column.sql', 'utf8');
        
        // Execute the SQL script
        await client.query(sql);
        
        console.log('✅ EmploymentType column migration completed!');
        
        // Verify the column was added
        const columnCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'ProjectQualifications' 
            AND column_name = 'EmploymentType'
        `);
        
        if (columnCheck.rows.length > 0) {
            console.log('📋 EmploymentType column details:');
            columnCheck.rows.forEach(row => {
                console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        } else {
            console.log('❌ EmploymentType column not found after migration');
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
    }
}

runEmploymentTypeMigration();