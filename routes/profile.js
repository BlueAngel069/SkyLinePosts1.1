const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/PFP');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Always overwrite with [username]PFP + extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${req.session.user.username}PFP${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// GET logged-in user's profile page
router.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const username = req.session.user.username;
  db.get('SELECT * FROM profiles WHERE username = ?', [username], (err, row) => {
    if (err) return res.send('Database error.');
    res.render('profile', { profile: row || {}, username });
  });
});

// POST to update logged-in user's profile
router.post('/', upload.single('photo'), (req, res) => {
  const currentUsername = req.session.user.username;
  const { username: newUsername, bio } = req.body;
  const photoPath = `/uploads/PFP/${newUsername}PFP${req.file ? path.extname(req.file.originalname) : '.png'}`;

  db.get('SELECT last_username_change FROM users WHERE username = ?', [currentUsername], (err, row) => {
    if (err) return res.send('Database read error.');
    const now = new Date();
    const lastChange = row?.last_username_change ? new Date(row.last_username_change) : new Date(0);
    const thirtyDays = 1000 * 60 * 60 * 24 * 30;

    if (currentUsername !== newUsername && (now - lastChange < thirtyDays)) {
      return res.send('You can only change your username once every 30 days.');
    }

    db.get('SELECT * FROM users WHERE username = ? AND username != ?', [newUsername, currentUsername], (err, existing) => {
      if (existing) return res.send('Username already taken.');

      db.run(`UPDATE users SET username = ?, last_username_change = ? WHERE username = ?`, [newUsername, now.toISOString(), currentUsername]);

      db.run(`
        INSERT INTO profiles (username, bio, photo)
        VALUES (?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
          bio = excluded.bio,
          photo = excluded.photo
      `, [newUsername, bio, photoPath], () => {
        req.session.user.username = newUsername;
        res.redirect('/profile');
      });
    });
  });
});

// View another user's public profile
router.get('/users/:username', (req, res) => {
  const targetUser = req.params.username;

  db.get('SELECT * FROM profiles WHERE username = ?', [targetUser], (err, row) => {
    if (err) return res.send('Database error.');
    if (!row) return res.send('User not found.');

    res.render('publicprofile', { targetUser, profile: row });
  });
});

module.exports = router;
