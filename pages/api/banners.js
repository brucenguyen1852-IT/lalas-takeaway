const db = require('../../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const banners = db.getBanners();
    return res.status(200).json(banners);
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}
