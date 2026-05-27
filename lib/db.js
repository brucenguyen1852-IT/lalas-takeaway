const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'lalas.db')
  : path.join(__dirname, '..', 'data', 'lalas.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// --- Settings ---
function getSetting(key) {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function getAllSettings() {
  const rows = getDb().prepare('SELECT * FROM settings').all();
  const result = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

// --- Categories ---
function getCategories() {
  return getDb().prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order').all();
}

function getAllCategories() {
  return getDb().prepare('SELECT * FROM categories ORDER BY sort_order').all();
}

function getCategory(id) {
  return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function addCategory(name, image, sortOrder) {
  return getDb().prepare('INSERT INTO categories (name, image, sort_order) VALUES (?, ?, ?)').run(name, image || null, sortOrder || 0);
}

function updateCategory(id, name, image, sortOrder, active) {
  return getDb().prepare('UPDATE categories SET name = ?, image = ?, sort_order = ?, active = ? WHERE id = ?').run(name, image, sortOrder, active, id);
}

function deleteCategory(id) {
  return getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
}

// --- Menu Items ---
function getMenuItems(categoryId) {
  if (categoryId) {
    return getDb().prepare('SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.active = 1 AND mi.category_id = ? ORDER BY mi.sort_order').all(categoryId);
  }
  return getDb().prepare('SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.active = 1 ORDER BY mi.sort_order').all();
}

function getAllMenuItems() {
  return getDb().prepare('SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id ORDER BY mi.sort_order').all();
}

function getMenuItem(id) {
  return getDb().prepare('SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.id = ?').get(id);
}

function addMenuItem(name, description, price, image, categoryId, sortOrder) {
  return getDb().prepare('INSERT INTO menu_items (name, description, price, image, category_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(name, description || null, price, image || null, categoryId || null, sortOrder || 0);
}

function updateMenuItem(id, name, description, price, image, categoryId, sortOrder, active) {
  return getDb().prepare('UPDATE menu_items SET name = ?, description = ?, price = ?, image = ?, category_id = ?, sort_order = ?, active = ? WHERE id = ?').run(name, description, price, image, categoryId, sortOrder, active, id);
}

function deleteMenuItem(id) {
  return getDb().prepare('DELETE FROM menu_items WHERE id = ?').run(id);
}

// --- Banners ---
function getBanners() {
  return getDb().prepare('SELECT * FROM banners WHERE active = 1 ORDER BY sort_order').all();
}

function getAllBanners() {
  return getDb().prepare('SELECT * FROM banners ORDER BY sort_order').all();
}

function addBanner(title, image, link, sortOrder) {
  return getDb().prepare('INSERT INTO banners (title, image, link, sort_order) VALUES (?, ?, ?, ?)').run(title || null, image, link || null, sortOrder || 0);
}

function updateBanner(id, title, image, link, sortOrder, active) {
  return getDb().prepare('UPDATE banners SET title = ?, image = ?, link = ?, sort_order = ?, active = ? WHERE id = ?').run(title, image, sortOrder, active, id);
}

function deleteBanner(id) {
  return getDb().prepare('DELETE FROM banners WHERE id = ?').run(id);
}

// --- Orders ---
function createOrder(customerName, phone, address, notes, total, items) {
  const { v4: uuidv4 } = require('uuid');
  const trackingCode = uuidv4().substring(0, 8).toUpperCase();

  const insertOrder = getDb().prepare('INSERT INTO orders (customer_name, phone, address, notes, total, tracking_code) VALUES (?, ?, ?, ?, ?, ?)');
  const insertItem = getDb().prepare('INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)');

  const transaction = getDb().transaction(() => {
    const result = insertOrder.run(customerName, phone, address || null, notes || null, total, trackingCode);
    const orderId = result.lastInsertRowid;
    for (const item of items) {
      insertItem.run(orderId, item.menu_item_id, item.name, item.quantity, item.price);
    }
    return { orderId, trackingCode };
  });

  return transaction();
}

function getOrderByTracking(trackingCode, phone) {
  const order = getDb().prepare('SELECT * FROM orders WHERE tracking_code = ? AND phone = ?').get(trackingCode, phone);
  if (order) {
    order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  return order;
}

function getOrder(id) {
  const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (order) {
    order.items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  return order;
}

function getOrders(status) {
  if (status) {
    return getDb().prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
  }
  return getDb().prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
}

function updateOrderStatus(id, status) {
  return getDb().prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
}

// --- Revenue ---
function addRevenue(orderId, amount) {
  return getDb().prepare('INSERT INTO revenue (order_id, amount) VALUES (?, ?)').run(orderId, amount);
}

function getRevenue(weekStart) {
  if (weekStart) {
    return getDb().prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue WHERE created_at >= ?').get(weekStart);
  }
  return getDb().prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue').get();
}

function getRevenueDetails(weekStart) {
  if (weekStart) {
    return getDb().prepare(`
      SELECT r.*, o.customer_name, o.phone, o.tracking_code
      FROM revenue r
      JOIN orders o ON r.order_id = o.id
      WHERE r.created_at >= ?
      ORDER BY r.created_at DESC
    `).all(weekStart);
  }
  return getDb().prepare(`
    SELECT r.*, o.customer_name, o.phone, o.tracking_code
    FROM revenue r
    JOIN orders o ON r.order_id = o.id
    ORDER BY r.created_at DESC
  `).all();
}

function deleteOldRevenue(beforeDate) {
  return getDb().prepare('DELETE FROM revenue WHERE created_at < ?').run(beforeDate);
}

module.exports = {
  getDb,
  getSetting, setSetting, getAllSettings,
  getCategories, getAllCategories, getCategory, addCategory, updateCategory, deleteCategory,
  getMenuItems, getAllMenuItems, getMenuItem, addMenuItem, updateMenuItem, deleteMenuItem,
  getBanners, getAllBanners, addBanner, updateBanner, deleteBanner,
  createOrder, getOrderByTracking, getOrder, getOrders, updateOrderStatus,
  addRevenue, getRevenue, getRevenueDetails, deleteOldRevenue,
};
