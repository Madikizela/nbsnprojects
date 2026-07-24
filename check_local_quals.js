const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, database: 'nbsnproject', user: 'postgres', password: 'postgres' });

async function main() {
  await c.connect();
  const tables = ['LegacyQualifications', 'OccupationalQualifications', 'LegacyUnitStandards', 'OccupationalUnitStandards'];
  for (const t of tables) {
    try {
      const r = await c.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`${t}: ${r.rows[0].count} rows`);
    } catch (e) {
      console.log(`${t}: ERROR - ${e.message}`);
    }
  }
  await c.end();
}
main().catch(console.error);
