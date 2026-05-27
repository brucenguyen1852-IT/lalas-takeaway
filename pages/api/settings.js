const db = require('../../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const settings = db.getAllSettings();
    return res.status(200).json(settings);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}
