const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db/schema');

// GET /auth/login
router.get('/login', (req, res) => {
  res.render('auth/login', { user: req.session.user, error: req.flash('error'), success: req.flash('success') });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/auth/login');
  }
  req.session.user = { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin };
  res.redirect(user.is_admin ? '/admin' : '/');
});

// GET /auth/register
router.get('/register', (req, res) => {
  res.render('auth/register', { user: req.session.user, error: req.flash('error') });
});

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, email, password, address, phone } = req.body;
  if (!name || !email || !password) {
    req.flash('error', 'Name, email, and password are required.');
    return res.redirect('/auth/register');
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    req.flash('error', 'An account with that email already exists.');
    return res.redirect('/auth/register');
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, address, phone)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email, hash, address || null, phone || null);
  req.session.user = { id: result.lastInsertRowid, name, email, is_admin: 0 };
  req.flash('success', 'Welcome to Curious Critters!');
  res.redirect('/');
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// GET /auth/profile
router.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const user = db.prepare('SELECT id, name, email, address, phone, created_at FROM users WHERE id = ?').get(req.session.user.id);
  const orders = db.prepare(`
    SELECT o.*, COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.placed_at DESC
  `).all(req.session.user.id);
  res.render('auth/profile', { user: req.session.user, profile: user, orders, error: req.flash('error'), success: req.flash('success') });
});

// POST /auth/profile
router.post('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { name, address, phone, current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);

  if (new_password) {
    if (!bcrypt.compareSync(current_password, user.password_hash)) {
      req.flash('error', 'Current password is incorrect.');
      return res.redirect('/auth/profile');
    }
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET name=?, address=?, phone=?, password_hash=? WHERE id=?')
      .run(name, address, phone, hash, user.id);
  } else {
    db.prepare('UPDATE users SET name=?, address=?, phone=? WHERE id=?')
      .run(name, address, phone, user.id);
  }

  req.session.user.name = name;
  req.flash('success', 'Profile updated!');
  res.redirect('/auth/profile');
});

module.exports = router;
