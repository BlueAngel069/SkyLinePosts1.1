const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const friendRoutes = require('./routes/friends');
const messageRoutes = require('./routes/messages');

// Import Routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const profileRoutes = require('./routes/profile');

const app = express();

// Set up EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Middleware for file upload
const upload = multer({
  dest: path.join(__dirname, 'public/uploads/profiles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// Simple in-memory session (not for production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'aP9fD3vL1k!qWzR8Xy2@2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Route bindings
app.use('/', authRoutes);
app.use('/blog', blogRoutes);
app.use('/profile', profileRoutes);
app.use('/messages', messageRoutes);
app.use('/friends', friendRoutes);

// Handle profile picture upload and user data update
app.post('/profile', upload.single('photo'), (req, res) => {
  const { username, bio } = req.body;
  const profilePic = req.file ? req.file.filename : null;

  db.run('UPDATE users SET profilePic = ?, bio = ? WHERE username = ?', [profilePic, bio, username], function(err) {
    if (err) return res.send('Error updating profile!');
    res.redirect('/profile');
  });
});

// Start server on port 3000
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
