const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('skills_development.db');

console.log('=== Updating Password Hashes to BCrypt Format ===');

const password = 'Admin123!';
const adminHash = bcrypt.hashSync(password, 12);
const userHash = bcrypt.hashSync(password, 12);

console.log('Generated admin hash:', adminHash);
console.log('Generated user hash:', userHash);

// Update admin password
db.run('UPDATE SystemAdmins SET PasswordHash = ? WHERE Email = "admin@system.local"', [adminHash], function(err) {
  if (err) {
    console.error('Error updating admin password:', err);
  } else {
    console.log('Admin password updated successfully');
  }
  
  // Update regular user password
  db.run('UPDATE Users SET PasswordHash = ? WHERE Email = "Madikizela21517799@gmail.com"', [userHash], function(err) {
    if (err) {
      console.error('Error updating user password:', err);
    } else {
      console.log('User password updated successfully');
    }
    
    // Verify the updates
    db.get('SELECT PasswordHash FROM SystemAdmins WHERE Email = "admin@system.local"', (err, adminRow) => {
      if (err) {
        console.error('Error verifying admin:', err);
      } else {
        console.log('Admin verification:', bcrypt.compareSync(password, adminRow.PasswordHash));
      }
      
      db.get('SELECT PasswordHash FROM Users WHERE Email = "Madikizela21517799@gmail.com"', (err, userRow) => {
        if (err) {
          console.error('Error verifying user:', err);
        } else {
          console.log('User verification:', bcrypt.compareSync(password, userRow.PasswordHash));
        }
        
        db.close();
        console.log('Password update complete!');
      });
    });
  });
});