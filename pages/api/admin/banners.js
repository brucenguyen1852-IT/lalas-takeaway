const db = require('../../../lib/db');

export default function handler(req, res) {
  const { method } = req;
  if (method === 'GET') return res.status(200).json(db.getAllBanners());
  if (method === 'POST') {
    const { title, image, link, sort_order } = req.body;
    if (!image) return res.status(400).json({ error: 'Image required' });
    db.addBanner(title, image, link, sort_order || 0);
    return res.status(201).json({ success: true });
  }
  if (method === 'PUT') {
    const { id, title, image, link, sort_order, active } = req.body;
    if (!id) return res.status(400).json({ error: 'ID required' });
    const banner = db.getAllBanners().find(b => b.id === id);
    if (!banner) return res.status(404).json({ error: 'Not found' });
    db.updateBanner(id, title || banner.title, image || banner.image, link || banner.link, sort_order || banner.sort_order, active !== undefined ? active : banner.active);
    return res.status(200).json({ success: true });
  }
  if (method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID required' });
    db.deleteBanner(parseInt(id));
    return res.status(200).json({ success: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
