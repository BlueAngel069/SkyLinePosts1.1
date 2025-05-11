const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Drop and recreate the messages table
db.serialize(() => {
  console.log('Dropping old messages table if it exists...');
  db.run(`DROP TABLE IF EXISTS messages`, (dropErr) => {
    if (dropErr) {
      console.error('Error dropping table:', dropErr.message);
    } else {
      console.log('Old messages table dropped.');

      console.log('Creating new messages table...');
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender TEXT NOT NULL,
          recipient TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT NOT NULL
        )
      `, (createErr) => {
        if (createErr) {
          console.error('Error creating table:', createErr.message);
        } else {
          console.log('New messages table created successfully.');
        }
        db.close();
      });
    }
  });
});
