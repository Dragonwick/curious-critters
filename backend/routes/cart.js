const express = require('express');
const router = express.Router();
const db = require('../db/schema');
const { requireLogin } = require('../middleware/auth');

const TAX_RATE = 0.0825;

function getCart(req) {
  return req.session.cart || {};
}

function cartSummary(cart) {
  let subtotal = 0;
  const items = [];
  for (const [id, entry] of Object.entries(cart)) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) continue;
    const unitPrice = product.on_sale && product.sale_price ? product.sale_price : product.price;
    const lineTotal = unitPrice * entry.qty;
    subtotal += lineTotal;
    items.push({ ...product, qty: entry.qty, unitPrice, lineTotal });
  }
  return { items, subtotal };
}

// GET /cart
router.get('/', (req, res) => {
  const cart = getCart(req);
  const { items, subtotal } = cartSummary(cart);
  const discountCode = req.session.discountCode || null;
  let discountAmount = 0;
  let discountMsg = null;

  if (discountCode) {
    const code = db.prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1').get(discountCode);
    if (code) {
      discountAmount = code.type === 'percent' ? subtotal * (code.value / 100) : code.value;
      discountMsg = code.type === 'percent' ? `${code.value}% off` : `$${code.value.toFixed(2)} off`;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;

  res.render('shop/cart', {
    user: req.session.user,
    items, subtotal, discountAmount, discountMsg,
    discountedSubtotal, tax, total, discountCode,
    error: req.flash('error'), success: req.flash('success')
  });
});

// POST /cart/add
router.post('/add', (req, res) => {
  const { product_id, qty } = req.body;
  const quantity = parseInt(qty) || 1;
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(product_id);
  if (!product) return res.redirect('/shop');

  if (!req.session.cart) req.session.cart = {};
  const cart = req.session.cart;
  const current = cart[product_id]?.qty || 0;
  const newQty = Math.min(current + quantity, product.quantity);
  cart[product_id] = { qty: newQty };

  req.flash('success', `${product.name} added to cart!`);
  res.redirect(req.headers.referer || '/shop');
});

// POST /cart/update
router.post('/update', (req, res) => {
  const { product_id, qty } = req.body;
  const quantity = parseInt(qty);
  if (!req.session.cart) return res.redirect('/cart');
  if (quantity <= 0) {
    delete req.session.cart[product_id];
  } else {
    const product = db.prepare('SELECT quantity FROM products WHERE id = ?').get(product_id);
    req.session.cart[product_id] = { qty: Math.min(quantity, product?.quantity || quantity) };
  }
  res.redirect('/cart');
});

// POST /cart/remove
router.post('/remove', (req, res) => {
  const { product_id } = req.body;
  if (req.session.cart) delete req.session.cart[product_id];
  res.redirect('/cart');
});

// POST /cart/discount
router.post('/discount', (req, res) => {
  const { code } = req.body;
  const discount = db.prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1').get(code?.toUpperCase());
  if (!discount) {
    req.flash('error', 'Invalid or expired discount code.');
  } else {
    req.session.discountCode = discount.code;
    req.flash('success', `Code "${discount.code}" applied!`);
  }
  res.redirect('/cart');
});

// POST /cart/remove-discount
router.post('/remove-discount', (req, res) => {
  req.session.discountCode = null;
  res.redirect('/cart');
});

// GET /cart/checkout
router.get('/checkout', requireLogin, (req, res) => {
  const cart = getCart(req);
  if (Object.keys(cart).length === 0) return res.redirect('/cart');

  const { items, subtotal } = cartSummary(cart);
  const discountCode = req.session.discountCode || null;
  let discountAmount = 0;
  if (discountCode) {
    const code = db.prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1').get(discountCode);
    if (code) discountAmount = code.type === 'percent' ? subtotal * (code.value / 100) : code.value;
  }
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;

  res.render('shop/checkout', { user: req.session.user, items, subtotal, discountAmount, discountedSubtotal, tax, total, discountCode });
});

// POST /cart/place-order
router.post('/place-order', requireLogin, (req, res) => {
  const cart = getCart(req);
  if (Object.keys(cart).length === 0) return res.redirect('/cart');

  const { items, subtotal } = cartSummary(cart);
  const discountCode = req.session.discountCode || null;
  let discountAmount = 0;
  if (discountCode) {
    const code = db.prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1').get(discountCode);
    if (code) discountAmount = code.type === 'percent' ? subtotal * (code.value / 100) : code.value;
  }
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;

  // Insert order in a transaction
  const placeOrder = db.transaction(() => {
    const order = db.prepare(`
      INSERT INTO orders (user_id, subtotal, tax, discount_amount, discount_code, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.session.user.id, subtotal, tax, discountAmount, discountCode, total);

    for (const item of items) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?)
      `).run(order.lastInsertRowid, item.id, item.qty, item.unitPrice);
      db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(item.qty, item.id);
    }

    return order.lastInsertRowid;
  });

  const orderId = placeOrder();
  req.session.cart = {};
  req.session.discountCode = null;
  req.flash('success', `Order #${orderId} placed! Thanks for shopping at Curious Critters.`);
  res.redirect(`/orders/${orderId}`);
});

module.exports = router;
