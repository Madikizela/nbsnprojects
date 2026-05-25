const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// PostgreSQL connection configuration
const pgConfig = {
    host: 'localhost',
    port: 5432,
    database: 'skills_development',
    user: 'postgres',
    password: 'postgres'
};

// SQLite database path
const sqlitePath = path.join(__dirname, 'skills_development.db');

async function migrateData() {
    console.log('Starting migration from SQLite to PostgreSQL...');
    
    // Connect to PostgreSQL
    const pgClient = new Client(pgConfig);
    await pgClient.connect();
    
    // Connect to SQLite
    const sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY);
    
    try {
        // Read all tables from SQLite
        const tables = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.name));
            });
        });
        
        console.log(`Found ${tables.length} tables to migrate:`, tables);
        
        for (const table of tables) {
            console.log(`\nMigrating table: ${table}`);
            
            // Get table structure
            const columns = await new Promise((resolve, reject) => {
                sqliteDb.all(`PRAGMA table_info(${table})`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`Columns in ${table}:`, columns.map(col => col.name));
            
            // Get all data from SQLite table
            const data = await new Promise((resolve, reject) => {
                sqliteDb.all(`SELECT * FROM ${table}`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`Migrating ${data.length} rows from ${table}`);
            
            if (data.length > 0) {
                // Convert column names to PostgreSQL case (lowercase with underscores)
                const pgColumns = columns.map(col => {
                    // Convert camelCase to snake_case
                    return col.name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
                });
                
                // Insert data into PostgreSQL
                for (const row of data) {
                    const values = columns.map(col => {
                        const value = row[col.name];
                        // Handle different data types
                        if (value === null || value === undefined) return null;
                        if (typeof value === 'boolean') return value ? 1 : 0;
                        return value;
                    });
                    
                    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                    const insertQuery = `INSERT INTO "${table}" (${pgColumns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
                    
                    try {
                        await pgClient.query(insertQuery, values);
                    } catch (error) {
                        console.error(`Error inserting into ${table}:`, error.message);
                        console.error('Row data:', row);
                        // Continue with other rows
                    }
                }
            }
        }
        
        console.log('\nMigration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pgClient.end();
        sqliteDb.close();
    }
}

// Run migration
migrateData().catch(console.error);