const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { requireLogin } = require('../middleware/auth');

// GET /orders/:id - view a single order
router.get('/:id', requireLogin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order || (order.user_id !== req.session.user.id && !req.session.user.is_admin)) {
    return res.status(403).render('error', { message: 'Order not found.', user: req.session.user });
  }
  const items = db.prepare(`
    SELECT oi.*, p.name, p.image_path FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(order.id);
  res.render('shop/order', { user: req.session.user, order, items, success: req.flash('success') });
});

module.exports = router;
