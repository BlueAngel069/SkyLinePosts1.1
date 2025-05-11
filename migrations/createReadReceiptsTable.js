const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS read_receipts (
      username TEXT NOT NULL,
      chat_with TEXT NOT NULL,
      last_read_message_id INTEGER,
      PRIMARY KEY (username, chat_with)
    )
  `, (err) => {
    if (err) {
      console.error('Failed to create read_receipts table:', err.message);
    } else {
      console.log('Read receipts table is ready.');
    }
    db.close();
  });
});
