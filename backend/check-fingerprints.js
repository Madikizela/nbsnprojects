const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'nbsnproject',
  user: 'postgres',
  password: 'postgres'
});

client.connect()
  .then(async () => {
    console.log('Connected to database\n');
    
    const result = await client.query(`
      SELECT 
        "Id", 
        "FirstName", 
        "LastName", 
        "LeftThumbTemplate",
        LENGTH("LeftThumbTemplate") as "LeftThumbTemplateLen",
        "RightThumbTemplate",
        LENGTH("RightThumbTemplate") as "RightThumbTemplateLen",
        "LeftThumbTemplateZk",
        LENGTH("LeftThumbTemplateZk") as "LeftThumbTemplateZkLen",
        "RightThumbTemplateZk",
        LENGTH("RightThumbTemplateZk") as "RightThumbTemplateZkLen"
      FROM "Learners"
    `);
    
    console.log('Learners with fingerprints:');
    console.log('='.repeat(100));
    
    result.rows.forEach(row => {
      console.log(`\nID: ${row.Id} - ${row.FirstName} ${row.LastName}`);
      console.log(`  Futronic - Left: ${row.LeftThumbTemplate ? 'YES (' + row.LeftThumbTemplateLen + ' chars)' : 'NO'}, Right: ${row.RightThumbTemplate ? 'YES (' + row.RightThumbTemplateLen + ' chars)' : 'NO'}`);
      console.log(`  ZKTeco   - Left: ${row.LeftThumbTemplateZk ? 'YES (' + row.LeftThumbTemplateZkLen + ' chars)' : 'NO'}, Right: ${row.RightThumbTemplateZk ? 'YES (' + row.RightThumbTemplateZkLen + ' chars)' : 'NO'}`);
      
      if (row.LeftThumbTemplateZk && row.LeftThumbTemplateZk.length > 0) {
        console.log(`    Left ZK Template Preview: ${row.LeftThumbTemplateZk.substring(0, Math.min(100, row.LeftThumbTemplateZk.length))}...`);
      }
    });
    
    await client.end();
  })
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
