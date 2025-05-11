const db = require('../db');

module.exports = {
  getAll: () => new Promise((resolve, reject) => {
    db.all('SELECT * FROM posts ORDER BY id DESC', [], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  }),

  getById: (id) => new Promise((resolve, reject) => {
    db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  }),

  create: ({ title, content, author, date, category, image }) => new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (title, content, author, date, category, image) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, author, date, category, image],
      function (err) {
        if (err) reject(err); else resolve({ id: this.lastID });
      }
    );
  }),

  update: ({ id, title, content }) => new Promise((resolve, reject) => {
    db.run(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?',
      [title, content, id],
      function (err) {
        if (err) reject(err); else resolve();
      }
    );
  }),

  delete: (id) => new Promise((resolve, reject) => {
    db.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
      if (err) reject(err); else resolve();
    });
  })
};
