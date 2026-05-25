const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();

const pgConfig = {
    host: 'localhost',
    database: 'rlms',
    user: 'postgres',
    password: '12345',
    port: 5432,
};

const sqliteDbPath = './skills_development.db';

async function verifyMigration() {
    const pgClient = new Client(pgConfig);
    const sqliteDb = new sqlite3.Database(sqliteDbPath);
    
    try {
        await pgClient.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Get SQLite table counts
        const sqlitePromise = (query) => {
            return new Promise((resolve, reject) => {
                sqliteDb.all(query, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };
        
        const sqliteTables = await sqlitePromise("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        
        console.log('\n📊 Migration Verification Report:');
        console.log('='.repeat(50));
        
        let totalSqliteRecords = 0;
        let totalPostgresRecords = 0;
        
        for (const table of sqliteTables) {
            const tableName = table.name;
            
            try {
                // Get SQLite count
                const sqliteCount = await sqlitePromise(`SELECT COUNT(*) as count FROM "${tableName}"`);
                const sqliteRecords = sqliteCount[0].count;
                totalSqliteRecords += sqliteRecords;
                
                // Get PostgreSQL count
                let pgRecords = 0;
                try {
                    const pgResult = await pgClient.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
                    pgRecords = parseInt(pgResult.rows[0].count);
                    totalPostgresRecords += pgRecords;
                } catch (pgErr) {
                    // Table might not exist in PostgreSQL
                    console.log(`⚠️  ${tableName}: SQLite=${sqliteRecords}, PostgreSQL=Table not found`);
                    continue;
                }
                
                // Compare counts
                if (sqliteRecords === pgRecords) {
                    console.log(`✅ ${tableName}: ${sqliteRecords} records (matched)`);
                } else {
                    console.log(`❌ ${tableName}: SQLite=${sqliteRecords}, PostgreSQL=${pgRecords} (mismatch)`);
                }
                
            } catch (err) {
                console.log(`❌ Error checking ${tableName}: ${err.message}`);
            }
        }
        
        console.log('='.repeat(50));
        console.log(`📈 Total Records - SQLite: ${totalSqliteRecords}, PostgreSQL: ${totalPostgresRecords}`);
        
        if (totalSqliteRecords === totalPostgresRecords) {
            console.log('✅ Migration verification PASSED - All records migrated successfully!');
        } else {
            console.log('⚠️  Migration verification WARNING - Record counts do not match');
        }
        
        // Check critical tables
        console.log('\n🔍 Critical Tables Check:');
        const criticalTables = ['SystemAdmins', 'Users'];
        
        for (const tableName of criticalTables) {
            try {
                const result = await pgClient.query(`SELECT * FROM "${tableName}" LIMIT 3`);
                console.log(`✅ ${tableName}: ${result.rows.length} sample records found`);
                
                if (result.rows.length > 0) {
                    console.log(`   Sample data: ${JSON.stringify(result.rows[0], null, 2)}`);
                }
            } catch (err) {
                console.log(`❌ ${tableName}: Error - ${err.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    } finally {
        await pgClient.end();
        sqliteDb.close();
    }
}

verifyMigration().catch(console.error);