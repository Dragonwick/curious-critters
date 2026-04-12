const db = require('./schema');
const bcrypt = require('bcrypt');

console.log('🐾 Seeding Curious Critters database...');

// Admin user
const adminHash = bcrypt.hashSync('admin1234', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (email, password_hash, name, is_admin)
  VALUES (?, ?, ?, 1)
`).run('admin@curiouscritters.com', adminHash, 'Shop Admin');

// Test user
const userHash = bcrypt.hashSync('password123', 10);
db.prepare(`
  INSERT OR IGNORE INTO users (email, password_hash, name, is_admin)
  VALUES (?, ?, ?, 0)
`).run('customer@test.com', userHash, 'Test Customer');

// Products
const products = [
  {
    name: 'Baby Dinosaur (Herbivore)',
    description: 'A gentle herbivorous dinosaur hatchling. Loves ferns. Will eventually destroy your garden but not your soul.',
    category: 'Pets',
    price: 4999.99,
    quantity: 3,
    image_path: '/images/dino.png'
  },
  {
    name: 'The Thing Under Your Bed',
    description: 'Already living with you, why not make it official? Comes pre-installed. Diet: socks and childhood memories.',
    category: 'Pets',
    price: 0.01,
    quantity: 99,
    image_path: '/images/under_bed.png'
  },
  {
    name: 'Fallen Angel (Domestic)',
    description: 'Housebroken. Mostly compliant. Still holds a grudge but will not act on it (probably). Seven wings.',
    category: 'Pets',
    price: 12000.00,
    quantity: 1,
    image_path: '/images/angel.png'
  },
  {
    name: 'Garden Gnome (Feral)',
    description: 'Captured from the suburbs. Will rearrange your garden at night. Do not make eye contact before 9am.',
    category: 'Pets',
    price: 149.99,
    quantity: 12,
    image_path: '/images/gnome.png'
  },
  {
    name: 'SCP-████ (Management Approved)',
    description: '[REDACTED]. Safe class. Mostly. Foundation paperwork included. Feed weekly.',
    category: 'Pets',
    price: 8500.00,
    quantity: 2,
    image_path: '/images/scp.png'
  },
  {
    name: 'Dust Bunny (Xl)',
    description: 'Found behind the refrigerator. Has gained sentience. Surprisingly affectionate. Allergies: itself.',
    category: 'Pets',
    price: 9.99,
    quantity: 47,
    image_path: '/images/dustbunny.png'
  },
  {
    name: 'Wilson (Volleyball)',
    description: 'Volleyball with a hand-drawn face. Loyal. Never argues. Best friend material. Already named.',
    category: 'Pets',
    price: 24.99,
    quantity: 20,
    image_path: '/images/wilson.png'
  },
  {
    name: 'Exotic Critter Food (Wet)',
    description: 'Formulated for beings of indeterminate species. Smells like ozone and regret. They love it.',
    category: 'Food',
    price: 12.99,
    quantity: 200,
    image_path: '/images/food_wet.png'
  },
  {
    name: 'Interdimensional Containment Crate',
    description: 'Rated for up to 4 dimensions. Rubber-sealed. Machine washable interior. Pet not included.',
    category: 'Housing',
    price: 299.99,
    quantity: 8,
    image_path: '/images/crate.png'
  },
  {
    name: 'Custom Engraved Tag',
    description: 'Stainless steel. Engrave your critter\'s name, your address, and a brief existential warning for the finder.',
    category: 'Accessories',
    price: 14.99,
    quantity: 500,
    image_path: '/images/tag.png'
  },
  {
    name: 'Plush Void Toy',
    description: 'Squeaks when compressed. Stares back. Machine washable. Your critter will disembowel it in 20 minutes.',
    category: 'Toys',
    price: 8.99,
    quantity: 75,
    image_path: '/images/toy.png'
  },
  {
    name: 'Grampa (Pre-owned)',
    description: 'Experienced. Calm demeanor. Knows three card tricks. Will tell you about the war unprompted. Friendly.',
    category: 'Pets',
    price: 0.99,
    quantity: 1,
    image_path: '/images/grampa.png',
    on_sale: 1,
    sale_price: 0.50
  },
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (name, description, category, price, quantity, image_path, on_sale, sale_price)
  VALUES (@name, @description, @category, @price, @quantity, @image_path, @on_sale, @sale_price)
`);

for (const p of products) {
  insertProduct.run({ on_sale: 0, sale_price: null, ...p });
}

// Discount codes
const codes = [
  { code: 'CRITTERS10', type: 'percent', value: 10 },
  { code: 'WELCOME5', type: 'flat', value: 5 },
  { code: 'VOID25', type: 'percent', value: 25 },
];

const insertCode = db.prepare(`
  INSERT OR IGNORE INTO discount_codes (code, type, value)
  VALUES (@code, @type, @value)
`);

for (const c of codes) insertCode.run(c);

console.log('✅ Seed complete!');
console.log('   Admin login: admin@curiouscritters.com / admin1234');
console.log('   User login:  customer@test.com / password123');
console.log('   Discount codes: CRITTERS10, WELCOME5, VOID25');
