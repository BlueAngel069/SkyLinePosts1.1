const db = require('../db');

module.exports = {
  findOne: ({ username }) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  create: ({ username, password }) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, username });
      });
    });
  }
};
