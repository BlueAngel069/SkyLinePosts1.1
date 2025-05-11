const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// View chat with a friend (with read receipt tracking)
router.get('/chat/:recipient', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;
  const recipient = req.params.recipient;

  db.all(`
    SELECT rowid AS id, sender, content, timestamp FROM messages
    WHERE (sender = ? AND recipient = ?)
       OR (sender = ? AND recipient = ?)
    ORDER BY timestamp ASC
  `, [currentUser, recipient, recipient, currentUser], (err, rows) => {
    if (err) {
      console.error('DB Error:', err.message);
      return res.send('Error loading messages.');
    }

    const lastMessageId = rows.length > 0 ? rows[rows.length - 1].id : null;

    if (lastMessageId !== null) {
      db.run(`
        INSERT INTO read_receipts (username, chat_with, last_read_message_id)
        VALUES (?, ?, ?)
        ON CONFLICT(username, chat_with) DO UPDATE SET last_read_message_id = excluded.last_read_message_id
      `, [currentUser, recipient, lastMessageId], (err) => {
        if (err) console.error('Failed to update read receipt:', err.message);

        db.get(`
          SELECT last_read_message_id FROM read_receipts
          WHERE username = ? AND chat_with = ?
        `, [recipient, currentUser], (err, readRow) => {
          const recipientLastReadId = readRow ? readRow.last_read_message_id : null;
          res.render('chat', {
            recipient,
            messages: rows,
            recipientLastReadId,
            user: req.session.user  // ✅ Pass user to view
          });
        });
      });
    } else {
      res.render('chat', {
        recipient,
        messages: rows,
        recipientLastReadId: null,
        user: req.session.user  // ✅ Pass user to view
      });
    }
  });
});

// Send a message
router.post('/chat/:recipient', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;
  const recipient = req.params.recipient;
  const messageContent = req.body.message;
  const timestamp = new Date().toLocaleString();

  db.run(`
    INSERT INTO messages (sender, recipient, content, timestamp)
    VALUES (?, ?, ?, ?)
  `, [currentUser, recipient, messageContent, timestamp], (err) => {
    if (err) {
      console.error("Insert failed:", err.message);
      return res.send('Error sending message.');
    }

    res.redirect(`/messages/chat/${recipient}`);
  });
});

// Start chat from button
router.post('/start', requireLogin, (req, res) => {
  const recipient = req.body.recipient;
  res.redirect(`/messages/chat/${recipient}`);
});

// View all conversation partners
router.get('/conversations', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;

  db.all(`
    SELECT DISTINCT 
      CASE 
        WHEN sender = ? THEN recipient 
        ELSE sender 
      END AS conversation_partner
    FROM messages
    WHERE sender = ? OR recipient = ?
  `, [currentUser, currentUser, currentUser], (err, rows) => {
    if (err) {
      console.error('DB Error:', err.message);
      return res.send('Error loading conversations.');
    }

    const conversations = rows.map(row => row.conversation_partner);
    res.render('conversations', { conversations });
  });
});

// Update typing status
router.post('/typing/:recipient', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;
  db.run(`
    INSERT INTO typing_status (username, is_typing) 
    VALUES (?, 1)
    ON CONFLICT(username) DO UPDATE SET is_typing = 1
  `, [currentUser], () => {
    res.sendStatus(200);
  });
});

// Clear typing status
router.post('/stop-typing/:recipient', requireLogin, (req, res) => {
  const currentUser = req.session.user.username;
  db.run(`UPDATE typing_status SET is_typing = 0 WHERE username = ?`, [currentUser], () => {
    res.sendStatus(200);
  });
});

// Get typing status of recipient
router.get('/typing-status/:recipient', requireLogin, (req, res) => {
  const recipient = req.params.recipient;
  db.get(`SELECT is_typing FROM typing_status WHERE username = ?`, [recipient], (err, row) => {
    res.json({ isTyping: row && row.is_typing === 1 });
  });
});

module.exports = router;
