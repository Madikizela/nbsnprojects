const { Pool } = require('pg');
const pool = new Pool({host:'localhost',port:5432,database:'nbsnproject',user:'postgres',password:'12345'});

async function run() {
  const queries = [
    `ALTER TABLE "Learners" ADD COLUMN IF NOT EXISTS "Username" VARCHAR(100)`,
    `ALTER TABLE "Learners" ADD COLUMN IF NOT EXISTS "PasswordHash" VARCHAR(255)`,
    `ALTER TABLE "Learners" ADD COLUMN IF NOT EXISTS "MustChangePassword" BOOLEAN NOT NULL DEFAULT TRUE`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "IX_Learners_Username" ON "Learners" ("Username") WHERE "Username" IS NOT NULL`,
  ];

  for (const q of queries) {
    await pool.query(q);
    console.log('✅', q.substring(0, 60));
  }
  console.log('Done.');
  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
