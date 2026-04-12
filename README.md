# 🐾 Curious Critters

> Exotic companions for unconventional households.

An online pet store for the discerning critter collector. Built with Node.js, Express, EJS, and SQLite.

---

## Setup

### Prerequisites
- Node.js v18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Seed the database with sample products + accounts
npm run seed

# Start the development server
npm run dev

# Or production start
npm start
```

Server runs at: **http://localhost:3000**

---

## Default Accounts

| Role    | Email                        | Password     |
|---------|------------------------------|--------------|
| Admin   | admin@curiouscritters.com    | admin1234    |
| Customer | customer@test.com           | password123  |

Admin panel: **http://localhost:3000/admin**

---

## Discount Codes (seeded)

| Code        | Discount        |
|-------------|-----------------|
| CRITTERS10  | 10% off         |
| WELCOME5    | $5 off          |
| VOID25      | 25% off         |

---

## Project Structure

```
curious-critters/
├── backend/
│   ├── server.js              # Express entry point
│   ├── db/
│   │   ├── schema.js          # SQLite schema + connection
│   │   └── seed.js            # Sample data seeder
│   ├── middleware/
│   │   └── auth.js            # requireLogin / requireAdmin
│   └── routes/
│       ├── shop.js            # Home, browse, product detail
│       ├── cart.js            # Cart, checkout, order placement
│       ├── auth.js            # Login, register, profile
│       ├── orders.js          # Order history view
│       └── admin.js           # Full admin backend
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   ├── style.css      # Main styles (dark gothic theme)
│   │   │   └── admin.css      # Admin panel styles
│   │   ├── js/main.js         # Client-side JS
│   │   └── images/            # Product images (+ uploads/)
│   └── views/
│       ├── partials/          # header.ejs, footer.ejs
│       ├── shop/              # home, browse, product, cart, checkout, order
│       ├── auth/              # login, register, profile
│       ├── admin/             # dashboard, products, orders, users, discounts
│       └── error.ejs
└── package.json
```

---

## Features

- **User auth** — register, login, profile edit, password change
- **Product catalog** — images, pricing, quantity, sale prices
- **Search & sort** — by name/description, price asc/desc, availability
- **Shopping cart** — session-based, live tax (8.25%), discount codes
- **Checkout & orders** — full order placement with history
- **Admin panel**
  - Product CRUD with image upload
  - User management + role assignment
  - Discount code creation/toggle
  - Order history sortable by date, customer, amount
  - Dashboard with live stats

---

## Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Server     | Node.js + Express             |
| Views      | EJS templating                |
| Database   | SQLite via better-sqlite3     |
| Auth       | bcrypt + express-session      |
| Uploads    | multer                        |
| IDE        | VS Code                       |
