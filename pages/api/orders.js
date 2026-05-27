const db = require('../../lib/db');

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { customer_name, phone, address, notes, items } = req.body;

    if (!customer_name || !phone) {
      return res.status(400).json({ error: 'Vui lòng nhập họ tên và số điện thoại.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống.' });
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    try {
      const { orderId, trackingCode } = db.createOrder(
        customer_name, phone, address, notes, total, items
      );

      // Notify order bot asynchronously
      try {
        const { notifyNewOrder } = require('../../lib/telegram-order');
        notifyNewOrder(orderId).catch(e => console.error('Notify error:', e));
      } catch (e) {
        console.error('Failed to load order bot for notification:', e.message);
      }

      return res.status(201).json({ order_id: orderId, tracking_code: trackingCode });
    } catch (err) {
      console.error('Create order error:', err);
      return res.status(500).json({ error: 'Lỗi khi tạo đơn hàng.' });
    }
  }

  if (req.method === 'GET') {
    const { status } = req.query;
    const orders = db.getOrders(status || null);
    // Load items for each order
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: db.getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id),
    }));
    return res.status(200).json(ordersWithItems);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}
