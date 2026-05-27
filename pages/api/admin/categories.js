const db = require('../../../lib/db');

export default function handler(req, res) {
  const { method } = req;
  if (method === 'GET') return res.status(200).json(db.getAllCategories());
  if (method === 'POST') {
    const { name, image, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    db.addCategory(name, image, sort_order || 0);
    return res.status(201).json({ success: true });
  }
  if (method === 'PUT') {
    const { id, name, image, sort_order, active } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const cat = db.getCategory(id);
    if (!cat) return res.status(404).json({ error: 'Not found' });
    db.updateCategory(id, name, image, sort_order, active !== undefined ? active : cat.active);
    return res.status(200).json({ success: true });
  }
  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    db.deleteCategory(parseInt(id));
    return res.status(200).json({ success: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
