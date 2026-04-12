const express = require('express');
const router = express.Router();
const db = require('../db/schema');

// GET / - homepage with featured products
router.get('/', (req, res) => {
  const featured = db.prepare(`
    SELECT * FROM products WHERE active = 1 ORDER BY RANDOM() LIMIT 6
  `).all();
  res.render('shop/home', { user: req.session.user, featured, success: req.flash('success') });
});

// GET /shop - browse all with search/sort
router.get('/shop', (req, res) => {
  const { q, sort, category } = req.query;
  let query = 'SELECT * FROM products WHERE active = 1';
  const params = [];

  if (q) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (sort === 'price_asc') query += ' ORDER BY COALESCE(CASE WHEN on_sale=1 THEN sale_price END, price) ASC';
  else if (sort === 'price_desc') query += ' ORDER BY COALESCE(CASE WHEN on_sale=1 THEN sale_price END, price) DESC';
  else if (sort === 'availability') query += ' ORDER BY quantity DESC';
  else query += ' ORDER BY name ASC';

  const products = db.prepare(query).all(...params);
  const categories = db.prepare('SELECT DISTINCT category FROM products WHERE active=1 AND category IS NOT NULL').all().map(r => r.category);

  res.render('shop/browse', { user: req.session.user, products, q, sort, category, categories });
});

// GET /shop/:id - product detail
router.get('/shop/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(req.params.id);
  if (!product) return res.status(404).render('error', { message: 'Critter not found.', user: req.session.user });
  res.render('shop/product', { user: req.session.user, product });
});

module.exports = router;
