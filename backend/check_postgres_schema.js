const { Client } = require('pg');

const pgConfig = {
    host: 'localhost',
    database: 'rlms',
    user: 'postgres',
    password: 'postgres',
    port: 5433,
};

async function checkPostgresSchema() {
    const client = new Client(pgConfig);
    
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL RLMS database');
        
        // Check if tables exist
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `;
        
        const result = await client.query(tablesQuery);
        
        if (result.rows.length === 0) {
            console.log('❌ No tables found in the database. Schema needs to be created.');
            return false;
        }
        
        console.log('✅ Found tables in PostgreSQL:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Check for specific tables we expect
        const expectedTables = [
            'SystemAdmins',
            'Users', 
            'legacy_qualifications',
            'LegacyUnitStandard',
            'SkillsDevelopmentProviders',
            'Clients',
            'Courses',
            'Modules',
            'Lessons',
            'Projects',
            'Documents'
        ];
        
        const existingTables = result.rows.map(row => row.table_name);
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        
        if (missingTables.length > 0) {
            console.log('⚠️  Missing expected tables:');
            missingTables.forEach(table => {
                console.log(`  - ${table}`);
            });
        } else {
            console.log('✅ All expected tables are present');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error checking PostgreSQL schema:', error.message);
        return false;
    } finally {
        await client.end();
    }
}

checkPostgresSchema().then(success => {
    if (success) {
        console.log('\n✅ PostgreSQL schema check completed');
    } else {
        console.log('\n❌ PostgreSQL schema check failed');
    }
}).catch(console.error);