const db = require('../../../lib/db');

export default function handler(req, res) {
  if (req.method === 'POST' || req.method === 'PUT') {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'string') {
        db.setSetting(key, value);
      }
    }
    return res.status(200).json({ success: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
