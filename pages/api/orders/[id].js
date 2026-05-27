const db = require('../../../lib/db');

export default function handler(req, res) {
  const { id } = req.query;
  const { phone } = req.query;

  if (req.method === 'GET') {
    if (!id || !phone) {
      return res.status(400).json({ error: 'Thiếu mã đơn hàng hoặc số điện thoại.' });
    }
    const order = db.getOrderByTracking(id, phone);
    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại.' });
    }
    return res.status(200).json(order);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}
