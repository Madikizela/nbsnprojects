const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Add teacher profile columns
        const alterQuery = `
            ALTER TABLE "Users" 
            ADD COLUMN IF NOT EXISTS "AddressLine1" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "AddressLine2" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "City" VARCHAR(100),
            ADD COLUMN IF NOT EXISTS "Province" VARCHAR(100),
            ADD COLUMN IF NOT EXISTS "PostalCode" VARCHAR(20),
            ADD COLUMN IF NOT EXISTS "ProfileImage" TEXT,
            ADD COLUMN IF NOT EXISTS "Signature" TEXT;
        `;

        await client.query(alterQuery);
        console.log('✓ Teacher profile columns added successfully');

        // Verify columns were added
        const verifyQuery = `
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'Users' 
            AND column_name IN ('AddressLine1', 'AddressLine2', 'City', 'Province', 'PostalCode', 'ProfileImage', 'Signature')
            ORDER BY column_name;
        `;

        const result = await client.query(verifyQuery);
        console.log('\nVerified columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
        });

        console.log('\n✓ Migration completed successfully!');
    } catch (error) {
        console.error('Error running migration:', error);
    } finally {
        await client.end();
    }
}

runMigration();
