const db = require('../../../lib/db');

export default function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    return res.status(200).json(db.getAllMenuItems());
  }
  if (method === 'POST') {
    const { name, description, price, image, category_id, sort_order, active } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    db.addMenuItem(name, description, price, image, category_id, sort_order || 0);
    return res.status(201).json({ success: true });
  }
  if (method === 'PUT') {
    const { id, name, description, price, image, category_id, sort_order, active } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const item = db.getMenuItem(id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    db.updateMenuItem(id, name, description, price, image, category_id, sort_order, active !== undefined ? active : item.active);
    return res.status(200).json({ success: true });
  }
  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    db.deleteMenuItem(parseInt(id));
    return res.status(200).json({ success: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
