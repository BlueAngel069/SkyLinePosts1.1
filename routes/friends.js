const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to check session
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// ✅ Route: Show Form to Send Friend Request
router.get('/add', requireLogin, (req, res) => {
  res.render('addfriend');  // Matches addfriend.ejs exactly
});

// ✅ Route: Handle Sending Friend Request
router.post('/request', requireLogin, (req, res) => {
  const { targetUser } = req.body;
  const currentUser = req.session.user.username;

  if (currentUser === targetUser) {
    return res.send('You cannot send a friend request to yourself.');
  }

  db.run(`
    INSERT OR IGNORE INTO friends (user, friend, status)
    VALUES (?, ?, 'pending')
  `, [currentUser, targetUser], function(err) {
    if (err) return res.send('Error sending friend request.');
    res.redirect('/blog/dashboard');
  });
});

// ✅ Route: Accept or Reject a Friend Request
router.post('/respond', requireLogin, (req, res) => {
  const { fromUser, response } = req.body;
  const currentUser = req.session.user.username;

  db.run(`
    UPDATE friends
    SET status = ?
    WHERE user = ? AND friend = ?
  `, [response, fromUser, currentUser], function(err) {
    if (err) return res.send('Error responding to friend request.');
    res.redirect('/friends/requests');
  });
});

// ✅ Route: List Accepted Friends as JSON
router.get('/list', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;

  db.all(`
    SELECT friend FROM friends
    WHERE user = ? AND status = 'accepted'
    UNION
    SELECT user FROM friends
    WHERE friend = ? AND status = 'accepted'
  `, [currentUser, currentUser], (err, rows) => {
    if (err) return res.send('Error retrieving friends.');
    res.json(rows.map(row => row.friend || row.user));
  });
});

// ✅ Route: Page to View Friends with Message Buttons
router.get('/page', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;

  db.all(`
    SELECT friend FROM friends
    WHERE user = ? AND status = 'accepted'
    UNION
    SELECT user FROM friends
    WHERE friend = ? AND status = 'accepted'
  `, [currentUser, currentUser], (err, rows) => {
    if (err) return res.send('Error loading friends.');
    const friends = rows.map(row => row.friend || row.user);
    res.render('friends', { friends });
  });
});

// ✅ Route: Page to View Pending Friend Requests
router.get('/requests', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;

  db.all(`
    SELECT user FROM friends
    WHERE friend = ? AND status = 'pending'
  `, [currentUser], (err, rows) => {
    if (err) return res.send('Error loading friend requests.');
    const requests = rows.map(row => row.user);
    res.render('friendrequests', { requests });
  });
});

module.exports = router;
