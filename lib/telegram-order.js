const { Bot, InlineKeyboard } = require('grammy');
const db = require('./db');

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

function esc(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Store reference to the order bot instance and admin chat ID
let orderBot = null;
let adminChatId = null;

function getAdminChatId() {
  if (adminChatId) return adminChatId;
  const saved = db.getSetting('admin_chat_id');
  if (saved) adminChatId = saved;
  return adminChatId;
}

function setAdminChatId(chatId) {
  adminChatId = String(chatId);
  db.setSetting('admin_chat_id', String(chatId));
}

// Send order notification to admin
async function notifyNewOrder(orderId) {
  if (!orderBot) {
    console.log('Order bot not initialized, skipping notification');
    return;
  }

  const chatId = getAdminChatId();
  if (!chatId) {
    console.log('Admin chat ID not set, skipping notification');
    return;
  }

  const order = db.getOrder(orderId);
  if (!order) return;

  const statusMap = { pending: '⏳ Chờ xác nhận', confirmed: '✅ Đã xác nhận', paid: '💰 Đã thanh toán', cancelled: '❌ Đã hủy' };
  const itemsList = order.items.map(i => `  • ${i.quantity}x ${i.item_name} - ${formatPrice(i.price * i.quantity)}`).join('\n');

  const msg =
    `🔔 *ĐƠN HÀNG MỚI*\n\n` +
    `📦 Mã đơn: #${esc(order.tracking_code)}\n` +
    `👤 Khách: ${esc(order.customer_name)}\n` +
    `📞 SĐT: ${esc(order.phone)}\n` +
    `📍 Địa chỉ: ${esc(order.address || '—')}\n` +
    `📝 Ghi chú: ${esc(order.notes || '—')}\n` +
    `🕐 Thời gian: ${new Date(order.created_at).toLocaleString('vi-VN')}\n\n` +
    `*Món đã đặt:*\n${itemsList}\n\n` +
    `*💰 Tổng: ${formatPrice(order.total)}*`;

  const keyboard = new InlineKeyboard()
    .text('✅ Xác nhận', `ob_confirm_${order.id}`)
    .text('💰 Đã thanh toán', `ob_pay_${order.id}`)
    .text('❌ Hủy', `ob_cancel_${order.id}`);

  try {
    await orderBot.api.sendMessage(chatId, msg, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error('Failed to send order notification:', err.message);
  }
}

function startOrderBot(token) {
  const bot = new Bot(token);
  orderBot = bot;

  bot.command('start', async (ctx) => {
    const chatId = String(ctx.chat.id);
    setAdminChatId(chatId);
    await ctx.reply(
      `🔔 *LaLa's Take Away - Bot Nhận Đơn*\n\n` +
      `Bot này sẽ gửi thông báo khi có đơn hàng mới\\.\n` +
      `Chat ID của bạn \\(${esc(chatId)}\\) đã được đăng ký nhận thông báo\\.\n\n` +
      `Các lệnh:\n` +
      `/orders \\- Xem đơn hàng gần đây\n` +
      `/revenue \\- Xem doanh thu tuần này`,
      { parse_mode: 'MarkdownV2' }
    );
  });

  bot.command('orders', async (ctx) => {
    const orders = db.getOrders();
    const recent = orders.slice(0, 5);

    if (recent.length === 0) {
      await ctx.reply('📦 Chưa có đơn hàng nào.');
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const order of recent) {
      const emoji = order.status === 'pending' ? '⏳' : order.status === 'confirmed' ? '✅' : order.status === 'paid' ? '💰' : '❌';
      keyboard.text(`${emoji} #${order.tracking_code} - ${formatPrice(order.total)}`, `ob_detail_${order.id}`).row();
    }

    await ctx.reply(
      `📦 *Đơn hàng gần đây* (${orders.length} tổng)`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.command('revenue', async (ctx) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().split('T')[0];

    const revenue = db.getRevenue(weekStart);
    const details = db.getRevenueDetails(weekStart);

    let msg = `💰 *Doanh thu tuần này* (từ ${weekStart})\n\n`;
    msg += `*Tổng: ${formatPrice(revenue.total)}*\n`;
    msg += `Số đơn: ${details.length}\n`;

    if (details.length > 0) {
      msg += `\n*Chi tiết:*\n`;
      for (const d of details.slice(0, 10)) {
        msg += `• ${esc(d.customer_name)} - ${formatPrice(d.amount)}\n`;
      }
    }

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  });

  // Order actions from inline keyboard
  bot.callbackQuery(/^ob_confirm_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);
    if (order && order.status === 'pending') {
      db.updateOrderStatus(orderId, 'confirmed');
      await ctx.reply(`✅ Đã xác nhận đơn #${order.tracking_code}`);
      await ctx.editMessageReplyMarkup({
        reply_markup: new InlineKeyboard()
          .text('💰 Đã thanh toán', `ob_pay_${order.id}`)
          .text('❌ Hủy', `ob_cancel_${order.id}`),
      });
    }
  });

  bot.callbackQuery(/^ob_pay_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);
    if (order && order.status !== 'cancelled' && order.status !== 'paid') {
      db.updateOrderStatus(orderId, 'paid');
      db.addRevenue(orderId, order.total);
      await ctx.reply(`💰 Đã thanh toán đơn #${order.tracking_code}\n+${formatPrice(order.total)} vào doanh thu`);
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    }
  });

  bot.callbackQuery(/^ob_cancel_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);
    if (order && order.status !== 'cancelled') {
      db.updateOrderStatus(orderId, 'cancelled');
      await ctx.reply(`❌ Đã hủy đơn #${order.tracking_code}`);
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    }
  });

  bot.callbackQuery(/^ob_detail_(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = db.getOrder(orderId);

    if (!order) {
      await ctx.editMessageText('Đơn hàng không tồn tại.');
      return;
    }

    const statusMap = { pending: '⏳ Chờ xác nhận', confirmed: '✅ Đã xác nhận', paid: '💰 Đã thanh toán', cancelled: '❌ Đã hủy' };
    const itemsList = order.items.map(i => `  • ${i.quantity}x ${i.item_name} - ${formatPrice(i.price * i.quantity)}`).join('\n');

    const keyboard = new InlineKeyboard();
    if (order.status === 'pending') {
      keyboard.text('✅ Xác nhận', `ob_confirm_${order.id}`).row();
    }
    if (order.status === 'pending' || order.status === 'confirmed') {
      keyboard.text('💰 Đã thanh toán', `ob_pay_${order.id}`).row();
      keyboard.text('❌ Hủy', `ob_cancel_${order.id}`).row();
    }

    await ctx.editMessageText(
      `📦 *Đơn #${esc(order.tracking_code)}*\n\n` +
      `Trạng thái: ${statusMap[order.status]}\n` +
      `Khách: ${esc(order.customer_name)}\n` +
      `SĐT: ${esc(order.phone)}\n` +
      `Địa chỉ: ${esc(order.address || '—')}\n` +
      `Ghi chú: ${esc(order.notes || '—')}\n\n` +
      `*Món:*\n${itemsList}\n\n` +
      `*Tổng: ${formatPrice(order.total)}*`,
      { parse_mode: 'Markdown', reply_markup: keyboard }
    );
  });

  bot.catch((err) => {
    console.error('Order bot error:', err);
  });

  return bot;
}

module.exports = { startOrderBot, notifyNewOrder };
