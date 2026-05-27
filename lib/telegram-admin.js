const { Bot, InlineKeyboard } = require('grammy');
const path = require('path');
const fs = require('fs');
const https = require('https');
const db = require('./db');

// User session state management
const sessions = new Map();

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { state: null, data: {} });
  }
  return sessions.get(chatId);
}

function clearSession(chatId) {
  sessions.delete(chatId);
}

// Download file from Telegram
async function downloadFile(ctx, fileId) {
  const file = await ctx.api.getFile(fileId);
  const filePath = file.file_path;
  const url = `https://api.telegram.org/file/bot${ctx.api.token}/${filePath}`;

  const ext = path.extname(filePath) || '.jpg';
  const filename = `telegram_${Date.now()}${ext}`;
  const destPath = path.join(__dirname, '..', 'public', 'uploads', filename);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve('/uploads/' + filename);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

// Escape markdown
function esc(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// --- Main Menu Keyboard ---
function mainMenu() {
  return new InlineKeyboard()
    .text('📊 Dashboard', 'dashboard').row()
    .text('🍜 Manage Dishes', 'menu_items').row()
    .text('📂 Manage Categories', 'menu_categories').row()
    .text('🖼 Manage Banners', 'menu_banners').row()
    .text('📦 View Orders', 'view_orders').row()
    .text('⚙️ Settings', 'menu_settings').row()
    .text('💰 Revenue', 'menu_revenue');
}

function backButton(target) {
  return new InlineKeyboard().text('← Back', target);
}

// --- Start Admin Bot ---
function startAdminBot(token) {
  const bot = new Bot(token);

  // /start command
  bot.command('start', async (ctx) => {
    clearSession(ctx.chat.id);
    const settings = db.getAllSettings();
    await ctx.reply(
      `🏪 *${esc(settings.site_name || "LaLa's Take Away")}* - Admin Panel\n\n` +
      `Welcome! Use the menu below to manage your website.`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu(),
      }
    );
  });

  // /chatid command - show chat ID
  bot.command('chatid', async (ctx) => {
    await ctx.reply(`Chat ID của bạn: \`${ctx.chat.id}\`\n\nDùng ID này để cài đặt ADMIN_CHAT_ID trong file .env.local`, {
      parse_mode: 'Markdown',
    });
  });

  // /cancel command
  bot.command('cancel', async (ctx) => {
    clearSession(ctx.chat.id);
    await ctx.reply('Operation cancelled.', { reply_markup: mainMenu() });
  });

  // --- Callback handlers ---
  bot.callbackQuery('dashboard', async (ctx) => {
    await ctx.answerCallbackQuery();
    const settings = db.getAllSettings();
    const items = db.getAllMenuItems();
    const categories = db.getAllCategories();
    const banners = db.getAllBanners();
    const orders = db.getOrders();

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalOrders = orders.length;
    const revenue = db.getRevenue();

    const msg =
      `📊 *Dashboard* - ${esc(settings.site_name || "LaLa's Take Away")}\n\n` +
      `🍜 *Món ăn:* ${items.length}\n` +
      `📂 *Danh mục:* ${categories.length}\n` +
      `🖼 *Banners:* ${banners.length}\n` +
      `📦 *Đơn hàng:* ${totalOrders} (${pendingOrders} chờ xử lý)\n` +
      `💰 *Doanh thu tuần này:* ${formatPrice(revenue.total)}`;

    await ctx.editMessageText(msg, {
      parse_mode: 'Markdown',
      reply_markup: backButton('start'),
    });
  });

  // ==================== MENU ITEMS MANAGEMENT ====================
  bot.callbackQuery('menu_items', async (ctx) => {
    await ctx.answerCallbackQuery();
    const items = db.getAllMenuItems();
    const keyboard = new InlineKeyboard();

    keyboard.text('➕ Add New Dish', 'add_item').row();
    if (items.length > 0) {
      keyboard.text('📋 Danh sách món', 'list_items').row();
    }
    keyboard.text('← Back', 'start');

    await ctx.editMessageText(
      `🍜 *Quản lý món ăn*\n\nTổng số món: ${items.length}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery('add_item', async (ctx) => {
    await ctx.answerCallbackQuery();
    const session = getSession(ctx.chat.id);
    session.state = 'awaiting_item_name';
    session.data = {};

    await ctx.reply(
      'Nhập *tên món ăn*:\n\n(Gửi /cancel để hủy)',
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('list_items', async (ctx) => {
    await ctx.answerCallbackQuery();
    const items = db.getAllMenuItems();

    if (items.length === 0) {
      await ctx.editMessageText('Chưa có món nào.', { reply_markup: backButton('menu_items') });
      return;
    }

    const keyboard = new InlineKeyboard();
    // Show first 10 items
    const pageItems = items.slice(0, 10);
    for (const item of pageItems) {
      const activeIcon = item.active ? '✅' : '❌';
      keyboard.text(`${activeIcon} ${item.name}`, `edit_item_${item.id}`).row();
    }
    keyboard.text('← Back', 'menu_items');

    await ctx.editMessageText(
      `📋 *Danh sách món* (${items.length} món)\n\nChọn món để xem chi tiết / xóa:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  // Edit item callback (dynamic: edit_item_<id>)
  bot.callbackQuery(/^edit_item_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const itemId = parseInt(ctx.match[1]);
    const item = db.getMenuItem(itemId);

    if (!item) {
      await ctx.editMessageText('Món không tồn tại.', { reply_markup: backButton('list_items') });
      return;
    }

    const keyboard = new InlineKeyboard()
      .text(item.active ? '❌ Ẩn món' : '✅ Hiện món', `toggle_item_${itemId}`).row()
      .text('🗑 Xóa món', `delete_item_${itemId}`).row()
      .text('← Back', 'list_items');

    await ctx.editMessageText(
      `🍜 *${esc(item.name)}*\n\n` +
      `Mô tả: ${esc(item.description || 'Không có')}\n` +
      `Giá: ${formatPrice(item.price)}\n` +
      `Danh mục: ${esc(item.category_name || 'Không có')}\n` +
      `Trạng thái: ${item.active ? '✅ Hiển thị' : '❌ Ẩn'}\n` +
      `Thứ tự: ${item.sort_order}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^toggle_item_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const itemId = parseInt(ctx.match[1]);
    const item = db.getMenuItem(itemId);
    if (item) {
      db.updateMenuItem(item.id, item.name, item.description, item.price, item.image, item.category_id, item.sort_order, item.active ? 0 : 1);
      await ctx.reply(`Đã ${item.active ? 'ẩn' : 'hiện'} món "${item.name}"`);
      // Refresh list
      const items = db.getAllMenuItems();
      const keyboard = new InlineKeyboard();
      for (const it of items.slice(0, 10)) {
        const ai = it.active ? '✅' : '❌';
        keyboard.text(`${ai} ${it.name}`, `edit_item_${it.id}`).row();
      }
      keyboard.text('← Back', 'menu_items');
      await ctx.editMessageText(
        `📋 *Danh sách món* (${items.length} món)`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery(/^delete_item_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const itemId = parseInt(ctx.match[1]);
    const item = db.getMenuItem(itemId);
    if (item) {
      db.deleteMenuItem(itemId);
      await ctx.reply(`Đã xóa món "${item.name}"`);
    }
    const items = db.getAllMenuItems();
    const keyboard = new InlineKeyboard();
    for (const it of items.slice(0, 10)) {
      const ai = it.active ? '✅' : '❌';
      keyboard.text(`${ai} ${it.name}`, `edit_item_${it.id}`).row();
    }
    keyboard.text('← Back', 'menu_items');
    await ctx.editMessageText(
      `📋 *Danh sách món* (${items.length} món)`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  // ==================== CATEGORIES MANAGEMENT ====================
  bot.callbackQuery('menu_categories', async (ctx) => {
    await ctx.answerCallbackQuery();
    const categories = db.getAllCategories();
    const keyboard = new InlineKeyboard();

    keyboard.text('➕ Thêm danh mục', 'add_category').row();
    if (categories.length > 0) {
      keyboard.text('📋 Danh sách danh mục', 'list_categories').row();
    }
    keyboard.text('← Back', 'start');

    await ctx.editMessageText(
      `📂 *Quản lý danh mục*\n\nTổng số danh mục: ${categories.length}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery('add_category', async (ctx) => {
    await ctx.answerCallbackQuery();
    const session = getSession(ctx.chat.id);
    session.state = 'awaiting_category_name';
    session.data = {};

    await ctx.reply(
      'Nhập *tên danh mục*:\n\n(Gửi /cancel để hủy)',
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('list_categories', async (ctx) => {
    await ctx.answerCallbackQuery();
    const categories = db.getAllCategories();

    if (categories.length === 0) {
      await ctx.editMessageText('Chưa có danh mục nào.', { reply_markup: backButton('menu_categories') });
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const cat of categories) {
      const ai = cat.active ? '✅' : '❌';
      keyboard.text(`${ai} ${cat.name}`, `edit_category_${cat.id}`).row();
    }
    keyboard.text('← Back', 'menu_categories');

    await ctx.editMessageText(
      `📋 *Danh sách danh mục* (${categories.length})\n\nChọn danh mục để xem / sửa:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^edit_category_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const catId = parseInt(ctx.match[1]);
    const cat = db.getCategory(catId);

    if (!cat) {
      await ctx.editMessageText('Danh mục không tồn tại.', { reply_markup: backButton('list_categories') });
      return;
    }

    const keyboard = new InlineKeyboard()
      .text(cat.active ? '❌ Ẩn' : '✅ Hiện', `toggle_category_${catId}`).row()
      .text('🗑 Xóa', `delete_category_${catId}`).row()
      .text('← Back', 'list_categories');

    await ctx.editMessageText(
      `📂 *${esc(cat.name)}*\n\n` +
      `Trạng thái: ${cat.active ? '✅ Hiển thị' : '❌ Ẩn'}\n` +
      `Thứ tự: ${cat.sort_order}\n` +
      `Ảnh: ${cat.image ? '✅ Có' : '❌ Không'}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^toggle_category_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const catId = parseInt(ctx.match[1]);
    const cat = db.getCategory(catId);
    if (cat) {
      db.updateCategory(cat.id, cat.name, cat.image, cat.sort_order, cat.active ? 0 : 1);
      await ctx.reply(`Đã ${cat.active ? 'ẩn' : 'hiện'} danh mục "${cat.name}"`);
      const categories = db.getAllCategories();
      const keyboard = new InlineKeyboard();
      for (const c of categories) {
        const ai = c.active ? '✅' : '❌';
        keyboard.text(`${ai} ${c.name}`, `edit_category_${c.id}`).row();
      }
      keyboard.text('← Back', 'menu_categories');
      await ctx.editMessageText(
        `📋 *Danh sách danh mục* (${categories.length})`,
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery(/^delete_category_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const catId = parseInt(ctx.match[1]);
    const cat = db.getCategory(catId);
    if (cat) {
      db.deleteCategory(catId);
      await ctx.reply(`Đã xóa danh mục "${cat.name}"`);
    }
    const categories = db.getAllCategories();
    const keyboard = new InlineKeyboard();
    for (const c of categories) {
      const ai = c.active ? '✅' : '❌';
      keyboard.text(`${ai} ${c.name}`, `edit_category_${c.id}`).row();
    }
    keyboard.text('← Back', 'menu_categories');
    await ctx.editMessageText(
      `📋 *Danh sách danh mục* (${categories.length})`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  // ==================== BANNERS MANAGEMENT ====================
  bot.callbackQuery('menu_banners', async (ctx) => {
    await ctx.answerCallbackQuery();
    const banners = db.getAllBanners();
    const keyboard = new InlineKeyboard();

    keyboard.text('➕ Thêm banner', 'add_banner').row();
    if (banners.length > 0) {
      keyboard.text('📋 Danh sách banner', 'list_banners').row();
    }
    keyboard.text('← Back', 'start');

    await ctx.editMessageText(
      `🖼 *Quản lý banner*\n\nTổng số banner: ${banners.length}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery('add_banner', async (ctx) => {
    await ctx.answerCallbackQuery();
    const session = getSession(ctx.chat.id);
    session.state = 'awaiting_banner_title';
    session.data = {};

    await ctx.reply(
      'Nhập *tiêu đề banner* (hoặc gửi "-" để bỏ qua):\n\n(Gửi /cancel để hủy)',
      { parse_mode: 'Markdown' }
    );
  });

  bot.callbackQuery('list_banners', async (ctx) => {
    await ctx.answerCallbackQuery();
    const banners = db.getAllBanners();

    if (banners.length === 0) {
      await ctx.editMessageText('Chưa có banner nào.', { reply_markup: backButton('menu_banners') });
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const b of banners) {
      const ai = b.active ? '✅' : '❌';
      keyboard.text(`${ai} ${b.title || 'Không tiêu đề'}`, `edit_banner_${b.id}`).row();
    }
    keyboard.text('← Back', 'menu_banners');

    await ctx.editMessageText(
      `🖼 *Danh sách banner* (${banners.length})\n\nChọn banner để xem / xóa:`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^edit_banner_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const bannerId = parseInt(ctx.match[1]);
    const banner = db.getAllBanners().find(b => b.id === bannerId);

    if (!banner) {
      await ctx.editMessageText('Banner không tồn tại.', { reply_markup: backButton('list_banners') });
      return;
    }

    const keyboard = new InlineKeyboard()
      .text(banner.active ? '❌ Ẩn' : '✅ Hiện', `toggle_banner_${bannerId}`).row()
      .text('🗑 Xóa', `delete_banner_${bannerId}`).row()
      .text('← Back', 'list_banners');

    await ctx.editMessageText(
      `🖼 *${esc(banner.title || 'Không tiêu đề')}*\n\n` +
      `Link: ${esc(banner.link || 'Không có')}\n` +
      `Trạng thái: ${banner.active ? '✅ Hiển thị' : '❌ Ẩn'}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^toggle_banner_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const bannerId = parseInt(ctx.match[1]);
    const banner = db.getAllBanners().find(b => b.id === bannerId);
    if (banner) {
      db.updateBanner(banner.id, banner.title, banner.image, banner.link, banner.sort_order, banner.active ? 0 : 1);
      await ctx.reply(`Đã ${banner.active ? 'ẩn' : 'hiện'} banner`);
    }
    const banners = db.getAllBanners();
    const keyboard = new InlineKeyboard();
    for (const b of banners) {
      const ai = b.active ? '✅' : '❌';
      keyboard.text(`${ai} ${b.title || 'Không tiêu đề'}`, `edit_banner_${b.id}`).row();
    }
    keyboard.text('← Back', 'menu_banners');
    await ctx.editMessageText(
      `🖼 *Danh sách banner* (${banners.length})`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^delete_banner_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const bannerId = parseInt(ctx.match[1]);
    const banner = db.getAllBanners().find(b => b.id === bannerId);
    if (banner) {
      db.deleteBanner(bannerId);
      await ctx.reply('Đã xóa banner');
    }
    const banners = db.getAllBanners();
    const keyboard = new InlineKeyboard();
    for (const b of banners) {
      const ai = b.active ? '✅' : '❌';
      keyboard.text(`${ai} ${b.title || 'Không tiêu đề'}`, `edit_banner_${b.id}`).row();
    }
    keyboard.text('← Back', 'menu_banners');
    await ctx.editMessageText(
      `🖼 *Danh sách banner* (${banners.length})`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  // ==================== SETTINGS ====================
  bot.callbackQuery('menu_settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    const settings = db.getAllSettings();
    const keyboard = new InlineKeyboard()
      .text('✏️ Sửa tên website', 'set_site_name').row()
      .text('✏️ Sửa mô tả', 'set_site_description').row()
      .text('✏️ Sửa địa chỉ', 'set_address').row()
      .text('✏️ Sửa số điện thoại', 'set_phone').row()
      .text('✏️ Sửa email', 'set_email').row()
      .text('✏️ Sửa giờ mở cửa', 'set_hours').row()
      .text('🖼 Cập nhật logo', 'set_logo').row()
      .text('← Back', 'start');

    await ctx.editMessageText(
      `⚙️ *Cài đặt website*\n\n` +
      `Tên: ${esc(settings.site_name || '—')}\n` +
      `Mô tả: ${esc(settings.site_description || '—')}\n` +
      `Địa chỉ: ${esc(settings.address || '—')}\n` +
      `SĐT: ${esc(settings.phone || '—')}\n` +
      `Email: ${esc(settings.email || '—')}\n` +
      `Giờ mở cửa: ${esc(settings.hours || '—')}\n` +
      `Logo: ${settings.logo ? '✅ Có' : '❌ Chưa có'}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  // Settings handlers
  const settingKeys = {
    set_site_name: 'site_name', set_site_description: 'site_description',
    set_address: 'address', set_phone: 'phone', set_email: 'email',
    set_hours: 'hours',
  };

  for (const [cbKey, settingKey] of Object.entries(settingKeys)) {
    bot.callbackQuery(cbKey, async (ctx) => {
      await ctx.answerCallbackQuery();
      const session = getSession(ctx.chat.id);
      session.state = 'awaiting_setting';
      session.data = { settingKey };

      await ctx.reply(
        `Nhập giá trị mới cho *${settingKey}*:\n\n(Gửi /cancel để hủy)`,
        { parse_mode: 'Markdown' }
      );
    });
  }

  bot.callbackQuery('set_logo', async (ctx) => {
    await ctx.answerCallbackQuery();
    const session = getSession(ctx.chat.id);
    session.state = 'awaiting_logo';

    await ctx.reply(
      '🖼 Gửi *ảnh logo* cho website:\n\n(Gửi /cancel để hủy)',
      { parse_mode: 'Markdown' }
    );
  });

  // ==================== ORDERS ====================
  bot.callbackQuery('view_orders', async (ctx) => {
    await ctx.answerCallbackQuery();
    const orders = db.getOrders();

    if (orders.length === 0) {
      await ctx.editMessageText('📦 Chưa có đơn hàng nào.', { reply_markup: backButton('start') });
      return;
    }

    // Show orders by status
    const pending = orders.filter(o => o.status === 'pending');
    const confirmed = orders.filter(o => o.status === 'confirmed');
    const paid = orders.filter(o => o.status === 'paid');

    const keyboard = new InlineKeyboard();
    if (pending.length > 0) keyboard.text(`⏳ Chờ xác nhận (${pending.length})`, 'orders_pending').row();
    if (confirmed.length > 0) keyboard.text(`✅ Đã xác nhận (${confirmed.length})`, 'orders_confirmed').row();
    if (paid.length > 0) keyboard.text(`💰 Đã thanh toán (${paid.length})`, 'orders_paid').row();
    keyboard.text('📋 Tất cả đơn', 'orders_all').row();
    keyboard.text('← Back', 'start');

    await ctx.editMessageText(
      `📦 *Đơn hàng*\n\n` +
      `⏳ Chờ xác nhận: ${pending.length}\n` +
      `✅ Đã xác nhận: ${confirmed.length}\n` +
      `💰 Đã thanh toán: ${paid.length}\n` +
      `📊 Tổng: ${orders.length}`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^orders_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const filter = ctx.match[1];
    let orders;
    let title;

    switch (filter) {
      case 'pending': orders = db.getOrders('pending'); title = '⏳ Chờ xác nhận'; break;
      case 'confirmed': orders = db.getOrders('confirmed'); title = '✅ Đã xác nhận'; break;
      case 'paid': orders = db.getOrders('paid'); title = '💰 Đã thanh toán'; break;
      default: orders = db.getOrders(); title = '📋 Tất cả đơn';
    }

    if (orders.length === 0) {
      await ctx.editMessageText(`Không có đơn hàng nào ở trạng thái "${title}"`, { reply_markup: backButton('view_orders') });
      return;
    }

    const keyboard = new InlineKeyboard();
    // Show first 8 orders
    for (const order of orders.slice(0, 8)) {
      const statusEmoji = order.status === 'pending' ? '⏳' : order.status === 'confirmed' ? '✅' : order.status === 'paid' ? '💰' : '❌';
      keyboard.text(`${statusEmoji} ${order.tracking_code} - ${formatPrice(order.total)}`, `order_detail_${order.id}`).row();
    }
    keyboard.text('← Back', 'view_orders');

    await ctx.editMessageText(
      `${title} (${orders.length} đơn)`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^order_detail_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);

    if (!order) {
      await ctx.editMessageText('Đơn hàng không tồn tại.', { reply_markup: backButton('view_orders') });
      return;
    }

    const itemsList = order.items.map(i => `  • ${i.quantity}x ${i.item_name} - ${formatPrice(i.price * i.quantity)}`).join('\n');
    const statusMap = { pending: '⏳ Chờ xác nhận', confirmed: '✅ Đã xác nhận', paid: '💰 Đã thanh toán', cancelled: '❌ Đã hủy' };

    const keyboard = new InlineKeyboard();
    if (order.status === 'pending') {
      keyboard.text('✅ Xác nhận đơn', `confirm_order_${order.id}`).row();
    }
    if (order.status === 'pending' || order.status === 'confirmed') {
      keyboard.text('💰 Đã thanh toán', `pay_order_${order.id}`).row();
      keyboard.text('❌ Hủy đơn', `cancel_order_${order.id}`).row();
    }
    keyboard.text('← Back', 'view_orders');

    await ctx.editMessageText(
      `📦 *Đơn hàng #${esc(order.tracking_code)}*\n\n` +
      `Trạng thái: ${statusMap[order.status]}\n` +
      `Khách hàng: ${esc(order.customer_name)}\n` +
      `SĐT: ${esc(order.phone)}\n` +
      `Địa chỉ: ${esc(order.address || '—')}\n` +
      `Ghi chú: ${esc(order.notes || '—')}\n` +
      `Ngày đặt: ${new Date(order.created_at).toLocaleString('vi-VN')}\n\n` +
      `*Món đã đặt:*\n${itemsList}\n\n` +
      `*Tổng cộng: ${formatPrice(order.total)}*`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery(/^confirm_order_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);
    if (order && order.status === 'pending') {
      db.updateOrderStatus(orderId, 'confirmed');
      await ctx.reply(`✅ Đã xác nhận đơn hàng #${order.tracking_code}`);
      // Refresh
      const updatedOrder = db.getOrder(orderId);
      const itemsList = updatedOrder.items.map(i => `  • ${i.quantity}x ${i.item_name} - ${formatPrice(i.price * i.quantity)}`).join('\n');
      const keyboard = new InlineKeyboard()
        .text('💰 Đã thanh toán', `pay_order_${orderId}`).row()
        .text('❌ Hủy đơn', `cancel_order_${orderId}`).row()
        .text('← Back', 'view_orders');
      await ctx.editMessageText(
        ctx.callbackQuery.message.text.replace('⏳ Chờ xác nhận', '✅ Đã xác nhận'),
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery(/^pay_order_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);
    if (order && order.status !== 'cancelled' && order.status !== 'paid') {
      db.updateOrderStatus(orderId, 'paid');
      db.addRevenue(orderId, order.total);
      await ctx.reply(`💰 Đã xác nhận thanh toán đơn hàng #${order.tracking_code}\nDoanh thu +${formatPrice(order.total)}`);
      // Refresh
      const keyboard = new InlineKeyboard().text('← Back', 'view_orders');
      await ctx.editMessageText(
        ctx.callbackQuery.message.text.replace(/⏳ Chờ xác nhận|✅ Đã xác nhận/, '💰 Đã thanh toán'),
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery(/^cancel_order_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);
    if (order) {
      db.updateOrderStatus(orderId, 'cancelled');
      await ctx.reply(`❌ Đã hủy đơn hàng #${order.tracking_code}`);
      const keyboard = new InlineKeyboard().text('← Back', 'view_orders');
      await ctx.editMessageText(
        ctx.callbackQuery.message.text.replace(/⏳ Chờ xác nhận|✅ Đã xác nhận|💰 Đã thanh toán/, '❌ Đã hủy'),
        { parse_mode: 'Markdown', reply_markup: keyboard }
      );
    }
  });

  // ==================== REVENUE ====================
  bot.callbackQuery('menu_revenue', async (ctx) => {
    await ctx.answerCallbackQuery();
    // Revenue for current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    const revenue = db.getRevenue(weekStart);
    const details = db.getRevenueDetails(weekStart);

    const keyboard = new InlineKeyboard()
      .text('🔄 Reset doanh thu', 'reset_revenue').row()
      .text('← Back', 'start');

    let msg = `💰 *Doanh thu tuần này* (từ ${weekStart})\n\n`;
    msg += `*Tổng: ${formatPrice(revenue.total)}*\n`;
    msg += `Số đơn đã thanh toán: ${details.length}\n\n`;

    if (details.length > 0) {
      msg += `*Chi tiết:*\n`;
      for (const d of details.slice(0, 10)) {
        msg += `• ${esc(d.customer_name)} - ${formatPrice(d.amount)} (${new Date(d.created_at).toLocaleDateString('vi-VN')})\n`;
      }
    }

    await ctx.editMessageText(msg, { parse_mode: 'Markdown', reply_markup: keyboard });
  });

  bot.callbackQuery('reset_revenue', async (ctx) => {
    await ctx.answerCallbackQuery();
    const keyboard = new InlineKeyboard()
      .text('⚠️ Xác nhận xóa', 'confirm_reset_revenue').row()
      .text('← Hủy', 'menu_revenue');

    await ctx.editMessageText(
      '⚠️ *Xác nhận xóa doanh thu*\n\nBạn có chắc muốn xóa TẤT CẢ doanh thu? Hành động này không thể hoàn tác.',
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.callbackQuery('confirm_reset_revenue', async (ctx) => {
    await ctx.answerCallbackQuery();
    const now = new Date();
    db.deleteOldRevenue(now.toISOString());
    await ctx.editMessageText(
      '✅ Đã xóa tất cả doanh thu.',
      { reply_markup: backButton('start') }
    );
  });

  // ==================== TEXT / PHOTO HANDLERS ====================
  bot.on('message:text', async (ctx) => {
    const session = getSession(ctx.chat.id);

    // Handle settings value input
    if (session.state === 'awaiting_setting') {
      const { settingKey } = session.data;
      db.setSetting(settingKey, ctx.message.text);
      clearSession(ctx.chat.id);
      await ctx.reply(`✅ Đã cập nhật *${settingKey}*`, {
        parse_mode: 'Markdown',
        reply_markup: backButton('menu_settings'),
      });
      return;
    }

    // Handle category name input
    if (session.state === 'awaiting_category_name') {
      session.data.name = ctx.message.text;
      session.state = 'awaiting_category_photo';
      await ctx.reply('Gửi *ảnh cho danh mục* (hoặc gửi "-" để bỏ qua):', { parse_mode: 'Markdown' });
      return;
    }

    // Handle item name input
    if (session.state === 'awaiting_item_name') {
      session.data.name = ctx.message.text;
      session.state = 'awaiting_item_description';
      await ctx.reply('Nhập *mô tả món* (hoặc gửi "-" để bỏ qua):', { parse_mode: 'Markdown' });
      return;
    }

    // Handle item description input
    if (session.state === 'awaiting_item_description') {
      const desc = ctx.message.text;
      session.data.description = desc === '-' ? '' : desc;
      session.state = 'awaiting_item_price';
      await ctx.reply('Nhập *giá* (VD: 50000):', { parse_mode: 'Markdown' });
      return;
    }

    // Handle item price input
    if (session.state === 'awaiting_item_price') {
      const price = parseFloat(ctx.message.text.replace(/[^0-9]/g, ''));
      if (isNaN(price) || price <= 0) {
        await ctx.reply('Giá không hợp lệ. Vui lòng nhập số (VD: 50000):');
        return;
      }
      session.data.price = price;
      session.state = 'awaiting_item_category';

      const categories = db.getCategories();
      if (categories.length === 0) {
        await ctx.reply('Chưa có danh mục nào. Tạo danh mục trước rồi thêm món sau.');
        clearSession(ctx.chat.id);
        return;
      }

      const keyboard = new InlineKeyboard();
      for (const cat of categories) {
        keyboard.text(cat.name, `select_item_cat_${cat.id}`).row();
      }
      keyboard.text('Bỏ qua', 'select_item_cat_none');

      await ctx.reply('Chọn *danh mục*:', { parse_mode: 'Markdown', reply_markup: keyboard });
      return;
    }

    // Handle banner title input
    if (session.state === 'awaiting_banner_title') {
      const title = ctx.message.text;
      session.data.title = title === '-' ? '' : title;
      session.state = 'awaiting_banner_link';
      await ctx.reply('Nhập *link cho banner* (hoặc gửi "-" để bỏ qua):', { parse_mode: 'Markdown' });
      return;
    }

    // Handle banner link input
    if (session.state === 'awaiting_banner_link') {
      const link = ctx.message.text;
      session.data.link = link === '-' ? '' : link;
      session.state = 'awaiting_banner_photo';
      await ctx.reply('Gửi *ảnh cho banner*:', { parse_mode: 'Markdown' });
      return;
    }
  });

  // Handle category selection for items
  bot.callbackQuery(/^select_item_cat_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const session = getSession(ctx.chat.id);
    const catId = ctx.match[1];

    if (catId === 'none') {
      session.data.category_id = null;
    } else {
      session.data.category_id = parseInt(catId);
    }
    session.state = 'awaiting_item_photo';

    await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    await ctx.reply('Gửi *ảnh cho món* (hoặc gửi "-" để bỏ qua):', { parse_mode: 'Markdown' });
  });

  // Handle photo messages
  bot.on('message:photo', async (ctx) => {
    const session = getSession(ctx.chat.id);

    try {
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const imagePath = await downloadFile(ctx, fileId);

      // Handle category photo
      if (session.state === 'awaiting_category_photo') {
        const { name } = session.data;
        db.addCategory(name, imagePath, 0);
        await ctx.reply(`✅ Đã thêm danh mục "${name}"`, { reply_markup: backButton('menu_categories') });
        clearSession(ctx.chat.id);
        return;
      }

      // Handle item photo
      if (session.state === 'awaiting_item_photo') {
        const { name, description, price, category_id } = session.data;
        db.addMenuItem(name, description, price, imagePath, category_id, 0);
        await ctx.reply(`✅ Đã thêm món "${name}" - ${formatPrice(price)}`, { reply_markup: backButton('menu_items') });
        clearSession(ctx.chat.id);
        return;
      }

      // Handle banner photo
      if (session.state === 'awaiting_banner_photo') {
        const { title, link } = session.data;
        db.addBanner(title, imagePath, link, 0);
        await ctx.reply(`✅ Đã thêm banner "${title || 'Không tiêu đề'}"`, { reply_markup: backButton('menu_banners') });
        clearSession(ctx.chat.id);
        return;
      }

      // Handle logo
      if (session.state === 'awaiting_logo') {
        db.setSetting('logo', imagePath);
        await ctx.reply('✅ Đã cập nhật logo website', { reply_markup: backButton('menu_settings') });
        clearSession(ctx.chat.id);
        return;
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      await ctx.reply('❌ Lỗi khi tải ảnh. Vui lòng thử lại.');
    }
  });

  // Handle "-" skip photo
  bot.on('message:text', async (ctx) => {
    const session = getSession(ctx.chat.id);
    if (ctx.message.text !== '-') return;

    // Skip category photo
    if (session.state === 'awaiting_category_photo') {
      const { name } = session.data;
      db.addCategory(name, null, 0);
      await ctx.reply(`✅ Đã thêm danh mục "${name}" (không ảnh)`, { reply_markup: backButton('menu_categories') });
      clearSession(ctx.chat.id);
      return;
    }

    // Skip item photo
    if (session.state === 'awaiting_item_photo') {
      const { name, description, price, category_id } = session.data;
      db.addMenuItem(name, description, price, null, category_id, 0);
      await ctx.reply(`✅ Đã thêm món "${name}" - ${formatPrice(price)} (không ảnh)`, { reply_markup: backButton('menu_items') });
      clearSession(ctx.chat.id);
      return;
    }
  });

  // Start button (for when menu is cleared)
  bot.callbackQuery('start', async (ctx) => {
    await ctx.answerCallbackQuery();
    clearSession(ctx.chat.id);
    const settings = db.getAllSettings();
    await ctx.editMessageText(
      `🏪 *${esc(settings.site_name || "LaLa's Take Away")}* - Admin Bot\n\nChào mừng quản lý! Sử dụng menu bên dưới để quản lý website.`,
      { parse_mode: 'Markdown', reply_markup: mainMenu() }
    );
  });

  // Error handler
  bot.catch((err) => {
    console.error('Admin bot error:', err);
  });

  return bot;
}

module.exports = { startAdminBot };
