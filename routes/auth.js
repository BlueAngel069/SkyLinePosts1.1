const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Render register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, existingUser) => {
    if (err) return res.send('Database error.');
    if (existingUser) return res.send('Username already taken.');

    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password, last_username_change) VALUES (?, ?, ?)',
      [username, hash, new Date().toISOString()],
      function (err) {
        if (err) return res.send('Registration failed.');
        req.session.user = { username };
        res.redirect('/blog/dashboard');
      });
  });
});

// Handle login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.send('Invalid login.');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Invalid login.');
    req.session.user = { username };
    res.redirect('/blog/dashboard');
  });
});

// Handle logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Redirect root URL to login or dashboard
router.get('/', (req, res) => {
  res.redirect('/login'); // or change to '/blog/dashboard'
});

module.exports = router;
