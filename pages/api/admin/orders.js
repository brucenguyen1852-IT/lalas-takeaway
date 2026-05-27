const db = require('../../../lib/db');

export default function handler(req, res) {
  if (req.method === 'PUT') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'ID and status required' });
    const order = db.getOrder(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    db.updateOrderStatus(id, status);

    // Add to revenue when marked as paid
    if (status === 'paid') {
      db.addRevenue(id, order.total);
      try {
        const { notifyNewOrder } = require('../../../lib/telegram-order');
        notifyNewOrder(id).catch(() => {});
      } catch (e) {}
    }

    return res.status(200).json({ success: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
