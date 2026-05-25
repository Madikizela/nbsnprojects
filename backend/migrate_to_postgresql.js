const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

// PostgreSQL connection configuration
const pgConfig = {
    host: 'localhost',
    database: 'rlms',
    user: 'postgres',
    password: '12345',
    port: 5432,
};

// SQLite database path
const sqliteDbPath = 'skills_development.db';

async function migrateData() {
    const pgClient = new Client(pgConfig);
    const sqliteDb = new sqlite3.Database(sqliteDbPath);

    try {
        // Connect to PostgreSQL
        await pgClient.connect();
        console.log('Connected to PostgreSQL');

        // Get all tables from SQLite
        const tables = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.name));
            });
        });

        console.log('Tables to migrate:', tables);

        // Priority order for migration (to handle foreign key dependencies)
        const migrationOrder = [
            'QualificationTypes',
            'Departments',
            'Clients',
            'SkillsDevelopmentProviders',
            'SystemAdmins',
            'Users',
            'LearningPathways',
            'Projects',
            'ProjectLearningPathways',
            'Courses',
            'Modules',
            'Lessons',
            'Documents',
            'DocumentPermissions',
            'DocumentAccessLogs',
            'DocumentAuditLogs',
            'ProjectQualifications',
            'legacy_qualifications',
            'occupational_qualifications',
            'LegacyUnitStandard',
            'occupational_unit_standards',
            'legacy_unit_standards'
        ];

        // Migrate tables in order
        for (const tableName of migrationOrder) {
            if (tables.includes(tableName)) {
                await migrateTable(sqliteDb, pgClient, tableName);
            }
        }

        // Migrate any remaining tables not in the priority list
        for (const tableName of tables) {
            if (!migrationOrder.includes(tableName)) {
                await migrateTable(sqliteDb, pgClient, tableName);
            }
        }

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        sqliteDb.close();
        await pgClient.end();
    }
}

async function migrateTable(sqliteDb, pgClient, tableName) {
    console.log(`\nMigrating table: ${tableName}`);

    try {
        // Get table schema from SQLite
        const schema = await new Promise((resolve, reject) => {
            sqliteDb.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Get all data from SQLite table
        const data = await new Promise((resolve, reject) => {
            sqliteDb.all(`SELECT * FROM ${tableName}`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (data.length === 0) {
            console.log(`  No data to migrate for ${tableName}`);
            return;
        }

        console.log(`  Found ${data.length} records`);

        // Create PostgreSQL table if it doesn't exist
        await createPostgreSQLTable(pgClient, tableName, schema);

        // Clear existing data in PostgreSQL table
        await pgClient.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);

        // Insert data into PostgreSQL
        const columns = Object.keys(data[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.map(col => `"${col}"`).join(', ');
        
        const insertQuery = `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`;

        for (const row of data) {
            const values = columns.map(col => row[col]);
            await pgClient.query(insertQuery, values);
        }

        console.log(`  Successfully migrated ${data.length} records to ${tableName}`);

    } catch (error) {
        console.error(`  Error migrating ${tableName}:`, error.message);
    }
}

async function createPostgreSQLTable(pgClient, tableName, schema) {
    // This is a simplified table creation - you may need to adjust data types
    const columns = schema.map(col => {
        let pgType = 'TEXT';
        
        switch (col.type.toUpperCase()) {
            case 'INTEGER':
                pgType = col.pk ? 'SERIAL PRIMARY KEY' : 'INTEGER';
                break;
            case 'REAL':
            case 'NUMERIC':
                pgType = 'NUMERIC';
                break;
            case 'TEXT':
            case 'VARCHAR':
                pgType = 'TEXT';
                break;
            case 'DATETIME':
            case 'TIMESTAMP':
                pgType = 'TIMESTAMP';
                break;
            case 'BOOLEAN':
                pgType = 'BOOLEAN';
                break;
        }

        return `"${col.name}" ${pgType}${col.notnull && !col.pk ? ' NOT NULL' : ''}`;
    });

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
            ${columns.join(',\n            ')}
        )
    `;

    try {
        await pgClient.query(createTableQuery);
        console.log(`  Table ${tableName} created/verified in PostgreSQL`);
    } catch (error) {
        console.log(`  Table ${tableName} already exists or creation skipped:`, error.message);
    }
}

// Run the migration
migrateData().catch(console.error);