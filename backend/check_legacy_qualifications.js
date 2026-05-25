const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'skills_development.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%legacy%'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  console.log('Legacy-related tables:', tables);
  
  // Check if LegacyQualification table exists
  const hasLegacyQualification = tables.some(t => t.name === 'LegacyQualification');
  
  if (hasLegacyQualification) {
    db.get('SELECT COUNT(*) as count FROM LegacyQualification', (err, result) => {
      if (err) {
        console.error('Error counting LegacyQualification:', err);
        db.close();
        return;
      }
      console.log('LegacyQualification count:', result.count);
      
      // Show sample data
      db.all('SELECT * FROM LegacyQualification LIMIT 5', (err, rows) => {
        if (err) {
          console.error('Error getting sample data:', err);
        } else {
          console.log('Sample LegacyQualification data:', rows);
        }
        db.close();
      });
    });
  } else {
    console.log('LegacyQualification table does not exist');
    db.close();
  }
});