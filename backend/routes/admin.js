const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db/schema');
const { requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Multer setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../frontend/public/images/uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.use(requireAdmin);

// GET /admin - dashboard
router.get('/', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as c FROM users WHERE is_admin = 0').get().c,
    products: db.prepare('SELECT COUNT(*) as c FROM products WHERE active = 1').get().c,
    orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    revenue: db.prepare('SELECT COALESCE(SUM(total), 0) as s FROM orders').get().s,
  };
  const recentOrders = db.prepare(`
    SELECT o.*, u.name as customer_name, COUNT(oi.id) as item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.placed_at DESC LIMIT 5
  `).all();
  res.render('admin/dashboard', { user: req.session.user, stats, recentOrders });
});

// ── PRODUCTS ──────────────────────────────────────────────

router.get('/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  res.render('admin/products', { user: req.session.user, products, success: req.flash('success') });
});

router.get('/products/new', (req, res) => {
  res.render('admin/product-form', { user: req.session.user, product: null, error: req.flash('error') });
});

router.post('/products/new', upload.single('image'), (req, res) => {
  const { name, description, category, price, quantity, on_sale, sale_price } = req.body;
  const image_path = req.file ? `/images/uploads/${req.file.filename}` : '/images/default.png';
  db.prepare(`
    INSERT INTO products (name, description, category, price, quantity, image_path, on_sale, sale_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, category, parseFloat(price), parseInt(quantity), image_path, on_sale ? 1 : 0, sale_price ? parseFloat(sale_price) : null);
  req.flash('success', 'Product created!');
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin/products');
  res.render('admin/product-form', { user: req.session.user, product, error: req.flash('error') });
});

router.post('/products/:id/edit', upload.single('image'), (req, res) => {
  const { name, description, category, price, quantity, on_sale, sale_price, active } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  const image_path = req.file ? `/images/uploads/${req.file.filename}` : product.image_path;
  db.prepare(`
    UPDATE products SET name=?, description=?, category=?, price=?, quantity=?, image_path=?, on_sale=?, sale_price=?, active=? WHERE id=?
  `).run(name, description, category, parseFloat(price), parseInt(quantity), image_path, on_sale ? 1 : 0, sale_price ? parseFloat(sale_price) : null, active ? 1 : 0, req.params.id);
  req.flash('success', 'Product updated!');
  res.redirect('/admin/products');
});

// ── USERS ──────────────────────────────────────────────

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, is_admin, created_at FROM users ORDER BY name').all();
  res.render('admin/users', { user: req.session.user, users, success: req.flash('success') });
});

router.get('/users/:id/edit', (req, res) => {
  const profile = db.prepare('SELECT id, name, email, address, phone, is_admin FROM users WHERE id = ?').get(req.params.id);
  if (!profile) return res.redirect('/admin/users');
  res.render('admin/user-form', { user: req.session.user, profile, error: req.flash('error') });
});

router.post('/users/:id/edit', (req, res) => {
  const { name, email, address, phone, is_admin, new_password } = req.body;
  if (new_password) {
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET name=?, email=?, address=?, phone=?, is_admin=?, password_hash=? WHERE id=?')
      .run(name, email, address, phone, is_admin ? 1 : 0, hash, req.params.id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, address=?, phone=?, is_admin=? WHERE id=?')
      .run(name, email, address, phone, is_admin ? 1 : 0, req.params.id);
  }
  req.flash('success', 'User updated!');
  res.redirect('/admin/users');
});

// ── DISCOUNT CODES ──────────────────────────────────────────────

router.get('/discounts', (req, res) => {
  const codes = db.prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all();
  res.render('admin/discounts', { user: req.session.user, codes, success: req.flash('success'), error: req.flash('error') });
});

router.post('/discounts/new', (req, res) => {
  const { code, type, value, uses_remaining } = req.body;
  try {
    db.prepare('INSERT INTO discount_codes (code, type, value, uses_remaining) VALUES (?, ?, ?, ?)')
      .run(code.toUpperCase(), type, parseFloat(value), uses_remaining ? parseInt(uses_remaining) : -1);
    req.flash('success', `Code "${code.toUpperCase()}" created!`);
  } catch (e) {
    req.flash('error', 'Code already exists.');
  }
  res.redirect('/admin/discounts');
});

router.post('/discounts/:id/toggle', (req, res) => {
  const code = db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(req.params.id);
  if (code) db.prepare('UPDATE discount_codes SET active = ? WHERE id = ?').run(code.active ? 0 : 1, code.id);
  res.redirect('/admin/discounts');
});

// ── ORDERS ──────────────────────────────────────────────

router.get('/orders', (req, res) => {
  const { sort } = req.query;
  let query = `
    SELECT o.*, u.name as customer_name, COUNT(oi.id) as item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
  `;
  if (sort === 'customer') query += ' ORDER BY u.name ASC';
  else if (sort === 'total') query += ' ORDER BY o.total DESC';
  else query += ' ORDER BY o.placed_at DESC';

  const orders = db.prepare(query).all();
  res.render('admin/orders', { user: req.session.user, orders, sort, success: req.flash('success') });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o JOIN users u ON u.id = o.user_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.redirect('/admin/orders');
  const items = db.prepare(`
    SELECT oi.*, p.name, p.image_path FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(order.id);
  res.render('admin/order-detail', { user: req.session.user, order, items });
});

module.exports = router;
