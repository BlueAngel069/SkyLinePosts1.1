const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const Post = require('../models/Post');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Dashboard with category filtering
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const selectedCategory = req.query.category || '';

  const query = `
    SELECT posts.*, profiles.photo 
    FROM posts 
    LEFT JOIN profiles ON posts.author = profiles.username 
    ORDER BY date DESC
  `;

  db.all(query, [], (err, allPosts) => {
    if (err) return res.send('Database error.');

    const categories = [...new Set(allPosts.map(post => post.category).filter(Boolean))];
    const posts = selectedCategory
      ? allPosts.filter(post => post.category === selectedCategory)
      : allPosts;

    res.render('dashboard', {
      user: req.session.user,
      posts,
      categories,
      selectedCategory
    });
  });
});

// ✅ Create new post with optional image
router.post('/create', upload.single('image'), async (req, res) => {
  const { title, content, category = 'General' } = req.body;
  const author = req.session.user.username;
  const date = new Date().toLocaleString();
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  await Post.create({ title, content, author, date, category, image });
  res.redirect('/blog/dashboard');
});

// ✅ Delete post
router.post('/delete/:id', async (req, res) => {
  await Post.delete(req.params.id);
  res.redirect('/blog/dashboard');
});

// ✅ Edit post (form) — only if author matches session user
router.get('/edit/:id', async (req, res) => {
  const post = await Post.getById(req.params.id);
  if (!post) return res.redirect('/blog/dashboard');

  if (post.author !== req.session.user.username) {
    return res.status(403).send('You are not authorized to edit this post.');
  }

  res.render('edit', { post });
});

// ✅ Save edit — only if author matches session user
router.post('/edit/:id', async (req, res) => {
  const post = await Post.getById(req.params.id);
  if (!post || post.author !== req.session.user.username) {
    return res.status(403).send('You are not allowed to edit this post.');
  }

  const { title, content } = req.body;
  await Post.update({ id: req.params.id, title, content });
  res.redirect('/blog/dashboard');
});

module.exports = router;
