const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS typing_status (
      username TEXT PRIMARY KEY,
      is_typing INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create typing_status table:', err.message);
    } else {
      console.log('Typing status table is ready.');
    }
    db.close();
  });
});
