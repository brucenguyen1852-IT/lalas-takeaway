const db = require('../../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { category } = req.query;
    const items = db.getMenuItems(category || null);
    return res.status(200).json(items);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}
