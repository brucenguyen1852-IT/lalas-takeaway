const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDb() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    return {
      settings: {},
      categories: [],
      menu_items: [],
      banners: [],
      orders: [],
      order_items: [],
      revenue: [],
      _nextId: 1,
    };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {
    return {
      settings: {},
      categories: [],
      menu_items: [],
      banners: [],
      orders: [],
      order_items: [],
      revenue: [],
      _nextId: 1,
    };
  }
}

function writeDb(data) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function nextId(data) {
  return data._nextId++;
}

let dbCache = null;

function getDb() {
  if (!dbCache) dbCache = readDb();
  return dbCache;
}

function saveDb() {
  if (dbCache) writeDb(dbCache);
}

// --- Settings ---
function getSetting(key) {
  const db = getDb();
  return db.settings[key] || null;
}

function setSetting(key, value) {
  const db = getDb();
  db.settings[key] = String(value);
  saveDb();
}

function getAllSettings() {
  return { ...getDb().settings };
}

// --- Categories ---
function getCategories() {
  return getDb().categories.filter(c => c.active !== false).sort((a, b) => a.sort_order - b.sort_order);
}

function getAllCategories() {
  return [...getDb().categories].sort((a, b) => a.sort_order - b.sort_order);
}

function getCategory(id) {
  return getDb().categories.find(c => c.id === id) || null;
}

function addCategory(name, image, sortOrder) {
  const db = getDb();
  const cat = { id: nextId(db), name, image: image || null, sort_order: sortOrder || 0, active: true };
  db.categories.push(cat);
  saveDb();
  return cat;
}

function updateCategory(id, name, image, sortOrder, active) {
  const db = getDb();
  const cat = db.categories.find(c => c.id === id);
  if (cat) {
    cat.name = name;
    cat.image = image;
    cat.sort_order = sortOrder;
    cat.active = active ? true : false;
    saveDb();
  }
}

function deleteCategory(id) {
  const db = getDb();
  db.categories = db.categories.filter(c => c.id !== id);
  saveDb();
}

// --- Menu Items ---
function getMenuItems(categoryId) {
  const db = getDb();
  let items = db.menu_items.filter(i => i.active !== false);
  if (categoryId) items = items.filter(i => i.category_id === categoryId);
  return items.sort((a, b) => a.sort_order - b.sort_order).map(item => ({
    ...item,
    category_name: (db.categories.find(c => c.id === item.category_id) || {}).name || null,
  }));
}

function getAllMenuItems() {
  const db = getDb();
  return [...db.menu_items].sort((a, b) => a.sort_order - b.sort_order).map(item => ({
    ...item,
    category_name: (db.categories.find(c => c.id === item.category_id) || {}).name || null,
  }));
}

function getMenuItem(id) {
  const db = getDb();
  const item = db.menu_items.find(i => i.id === id);
  if (!item) return null;
  return {
    ...item,
    category_name: (db.categories.find(c => c.id === item.category_id) || {}).name || null,
  };
}

function addMenuItem(name, description, price, image, categoryId, sortOrder) {
  const db = getDb();
  const item = {
    id: nextId(db),
    name,
    description: description || null,
    price: parseFloat(price),
    image: image || null,
    category_id: categoryId || null,
    sort_order: sortOrder || 0,
    active: true,
  };
  db.menu_items.push(item);
  saveDb();
  return item;
}

function updateMenuItem(id, name, description, price, image, categoryId, sortOrder, active) {
  const db = getDb();
  const item = db.menu_items.find(i => i.id === id);
  if (item) {
    item.name = name;
    item.description = description;
    item.price = parseFloat(price);
    item.image = image;
    item.category_id = categoryId;
    item.sort_order = sortOrder;
    item.active = active ? true : false;
    saveDb();
  }
}

function deleteMenuItem(id) {
  const db = getDb();
  db.menu_items = db.menu_items.filter(i => i.id !== id);
  saveDb();
}

// --- Banners ---
function getBanners() {
  return getDb().banners.filter(b => b.active !== false).sort((a, b) => a.sort_order - b.sort_order);
}

function getAllBanners() {
  return [...getDb().banners].sort((a, b) => a.sort_order - b.sort_order);
}

function addBanner(title, image, link, sortOrder) {
  const db = getDb();
  const banner = {
    id: nextId(db),
    title: title || null,
    image,
    link: link || null,
    sort_order: sortOrder || 0,
    active: true,
  };
  db.banners.push(banner);
  saveDb();
  return banner;
}

function updateBanner(id, title, image, link, sortOrder, active) {
  const db = getDb();
  const b = db.banners.find(x => x.id === id);
  if (b) {
    b.title = title;
    b.image = image;
    b.link = link;
    b.sort_order = sortOrder;
    b.active = active ? true : false;
    saveDb();
  }
}

function deleteBanner(id) {
  const db = getDb();
  db.banners = db.banners.filter(b => b.id !== id);
  saveDb();
}

// --- Orders ---
function createOrder(customerName, phone, address, notes, total, items) {
  const crypto = require('crypto');
  const db = getDb();
  const trackingCode = crypto.randomUUID().substring(0, 8).toUpperCase();

  const order = {
    id: nextId(db),
    customer_name: customerName,
    phone,
    address: address || null,
    notes: notes || null,
    total,
    status: 'pending',
    created_at: new Date().toISOString(),
    tracking_code: trackingCode,
  };
  db.orders.push(order);

  for (const item of items) {
    db.order_items.push({
      id: nextId(db),
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
    });
  }

  saveDb();
  return { orderId: order.id, trackingCode };
}

function getOrderByTracking(trackingCode, phone) {
  const db = getDb();
  const order = db.orders.find(o => o.tracking_code === trackingCode && o.phone === phone);
  if (order) {
    order.items = db.order_items.filter(i => i.order_id === order.id);
  }
  return order || null;
}

function getOrder(id) {
  const db = getDb();
  const order = db.orders.find(o => o.id === id);
  if (order) {
    order.items = db.order_items.filter(i => i.order_id === order.id);
  }
  return order || null;
}

function getOrders(status) {
  const db = getDb();
  let orders = [...db.orders];
  if (status) orders = orders.filter(o => o.status === status);
  return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function updateOrderStatus(id, status) {
  const db = getDb();
  const order = db.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    saveDb();
  }
}

// --- Revenue ---
function addRevenue(orderId, amount) {
  const db = getDb();
  db.revenue.push({
    id: nextId(db),
    order_id: orderId,
    amount,
    created_at: new Date().toISOString(),
  });
  saveDb();
}

function getRevenue(weekStart) {
  const db = getDb();
  let revenue = db.revenue;
  if (weekStart) {
    revenue = revenue.filter(r => r.created_at >= weekStart);
  }
  return { total: revenue.reduce((sum, r) => sum + r.amount, 0) };
}

function getRevenueDetails(weekStart) {
  const db = getDb();
  let revenue = db.revenue;
  if (weekStart) {
    revenue = revenue.filter(r => r.created_at >= weekStart);
  }
  return revenue.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(r => {
    const order = db.orders.find(o => o.id === r.order_id);
    return {
      ...r,
      customer_name: order ? order.customer_name : 'Unknown',
      phone: order ? order.phone : '',
      tracking_code: order ? order.tracking_code : '',
    };
  });
}

function deleteOldRevenue(beforeDate) {
  const db = getDb();
  const before = db.revenue.length;
  db.revenue = db.revenue.filter(r => r.created_at >= beforeDate);
  saveDb();
  return { changes: before - db.revenue.length };
}

// Reload cache (useful for testing)
function reloadDb() {
  dbCache = null;
}

module.exports = {
  getDb, reloadDb,
  getSetting, setSetting, getAllSettings,
  getCategories, getAllCategories, getCategory, addCategory, updateCategory, deleteCategory,
  getMenuItems, getAllMenuItems, getMenuItem, addMenuItem, updateMenuItem, deleteMenuItem,
  getBanners, getAllBanners, addBanner, updateBanner, deleteBanner,
  createOrder, getOrderByTracking, getOrder, getOrders, updateOrderStatus,
  addRevenue, getRevenue, getRevenueDetails, deleteOldRevenue,
};
