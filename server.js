const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize database before starting
const db = require('./lib/db');
db.getDb(); // This triggers DB creation if not exists

// Run init-db logic inline
db.getDb().exec(`
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, image TEXT, sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, image TEXT, category_id INTEGER, sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1, FOREIGN KEY (category_id) REFERENCES categories(id));
  CREATE TABLE IF NOT EXISTS banners (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, image TEXT NOT NULL, link TEXT, sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT, notes TEXT, total REAL NOT NULL, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, tracking_code TEXT UNIQUE);
  CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, menu_item_id INTEGER NOT NULL, item_name TEXT NOT NULL, quantity INTEGER NOT NULL, price REAL NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id));
  CREATE TABLE IF NOT EXISTS revenue (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, amount REAL NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (order_id) REFERENCES orders(id));
`);

const insertSetting = db.getDb().prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
const defaults = [
  ['site_name', "LaLa's Take Away"],
  ['site_description', 'Ẩm thực Việt Nam truyền thống'],
  ['address', '123 Đường ABC, Quận 1, TP. Hồ Chí Minh'],
  ['phone', '0900 123 456'],
  ['currency', 'VNĐ'],
  ['currency_symbol', '₫'],
];
for (const [k, v] of defaults) {
  insertSetting.run(k, v);
}

// Ensure uploads directory
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Website ready on http://localhost:${port}`);
  });

  // Start Telegram Bots
  const adminToken = process.env.ADMIN_BOT_TOKEN;
  const orderToken = process.env.ORDER_BOT_TOKEN;

  if (adminToken && adminToken !== 'your_admin_bot_token_here') {
    const { startAdminBot } = require('./lib/telegram-admin');
    const adminBot = startAdminBot(adminToken);
    adminBot.start({
      onStart: (botInfo) => {
        console.log(`> Admin Bot @${botInfo.username} started`);
      },
    });
  } else {
    console.log('> Admin Bot: NOT STARTED (set ADMIN_BOT_TOKEN in .env.local)');
  }

  if (orderToken && orderToken !== 'your_order_bot_token_here') {
    const { startOrderBot } = require('./lib/telegram-order');
    const orderBot = startOrderBot(orderToken);
    orderBot.start({
      onStart: (botInfo) => {
        console.log(`> Order Bot @${botInfo.username} started`);
      },
    });
  } else {
    console.log('> Order Bot: NOT STARTED (set ORDER_BOT_TOKEN in .env.local)');
  }

  // Weekly revenue auto-reset (check every hour)
  setInterval(() => {
    const now = new Date();
    // Reset revenue older than 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const result = db.deleteOldRevenue(sevenDaysAgo.toISOString());
    if (result.changes > 0) {
      console.log(`Weekly cleanup: removed ${result.changes} old revenue records`);
    }
  }, 60 * 60 * 1000); // Every hour

  console.log('> Server running. Press Ctrl+C to stop.');
});
