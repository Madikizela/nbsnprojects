const { Client } = require('pg');

async function checkQualificationStructure() {
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

        // Check ProjectQualifications table structure
        const projectQualResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'ProjectQualifications'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 ProjectQualifications table structure:');
        projectQualResult.rows.forEach(row => {
            console.log(`   ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Check sample data from ProjectQualifications
        const sampleData = await client.query(`
            SELECT * FROM "ProjectQualifications" LIMIT 3
        `);

        console.log('\n📋 Sample ProjectQualifications data:');
        if (sampleData.rows.length > 0) {
            sampleData.rows.forEach((row, index) => {
                console.log(`   Record ${index + 1}:`, row);
            });
        } else {
            console.log('   No data found in ProjectQualifications table');
        }

        // Check if there are employment-related columns in any table
        const employmentColumns = await client.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND (column_name ILIKE '%employment%' OR column_name ILIKE '%employ%')
        `);

        console.log('\n📋 Employment-related columns:');
        if (employmentColumns.rows.length > 0) {
            employmentColumns.rows.forEach(row => {
                console.log(`   ${row.table_name}.${row.column_name}: ${row.data_type}`);
            });
        } else {
            console.log('   No employment-related columns found');
        }

        // Check QualificationTypes table
        const qualTypes = await client.query(`
            SELECT * FROM "QualificationTypes"
        `);

        console.log('\n📋 QualificationTypes:');
        if (qualTypes.rows.length > 0) {
            qualTypes.rows.forEach(row => {
                console.log(`   ID: ${row.Id}, Name: ${row.Name}, Description: ${row.Description}`);
            });
        } else {
            console.log('   No qualification types found');
        }

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await client.end();
    }
}

checkQualificationStructure();