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

// Initialize database (JSON-based, auto-creates on first use)
const db = require('./lib/db');
const data = db.getDb();

// Seed default settings if empty
const defaults = [
  ['site_name', "LaLa's Take Away"],
  ['site_description', 'Authentic Vietnamese Cuisine'],
  ['address', '123 Main Street, District 1, Ho Chi Minh City'],
  ['phone', '0900 123 456'],
  ['currency', 'VND'],
  ['currency_symbol', '₫'],
];
for (const [k, v] of defaults) {
  if (!data.settings[k]) {
    data.settings[k] = v;
  }
}
// Save any newly seeded defaults
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'database.json');
fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

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

  // Start Order Telegram Bot (for receiving order notifications)
  const orderToken = process.env.ORDER_BOT_TOKEN;

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
