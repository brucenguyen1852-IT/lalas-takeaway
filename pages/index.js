import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [b, c, m, s] = await Promise.all([
          fetch('/api/banners').then(r => r.json()),
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/menu-items').then(r => r.json()),
          fetch('/api/settings').then(r => r.json()),
        ]);
        setBanners(Array.isArray(b) ? b : []);
        setCategories(Array.isArray(c) ? c : []);
        setItems(Array.isArray(m) ? m : []);
        setSettings(s || {});
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (loading) return <div className="flex items-center justify-center" style={{ height: '60vh' }}><div className="spinner" /></div>;

  const banner = banners[bannerIdx];

  return (
    <div>
      {/* Hero */}
      <section className="hero" style={banner ? { backgroundImage: `url(${banner.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        {banner && <div className="hero-bg" style={{ backgroundImage: `url(${banner.image})` }} />}
        <div className="hero-content">
          <h1 className="hero-title">{banner?.title || settings.site_name || "LaLa's Take Away"}</h1>
          <p className="hero-sub">{settings.site_description || 'Fresh Vietnamese cuisine, made with passion. Order takeaway — no account needed.'}</p>
          <div className="flex items-center justify-center gap-base" style={{ flexWrap: 'wrap' }}>
            <Link href="/menu" className="btn btn-accent btn-lg">View Our Menu</Link>
            <Link href="/tracking" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>Track Order</Link>
          </div>
        </div>
      </section>

      {/* Banner dots */}
      {banners.length > 1 && (
        <div className="flex items-center justify-center gap-sm" style={{ marginTop: -28, position: 'relative', zIndex: 2, paddingBottom: 20 }}>
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} style={{ width: i === bannerIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === bannerIdx ? 'var(--primary)' : 'var(--border)', transition: 'all var(--transition)', padding: 0, border: 'none', cursor: 'pointer' }} />
          ))}
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Browse by Category</h2>
              <Link href="/menu" className="section-link">See All →</Link>
            </div>
            <div className="categories">
              {categories.map(cat => (
                <Link key={cat.id} href={`/menu?category=${cat.id}`} className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                  {cat.image && <img src={cat.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Items */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Dishes</h2>
            <Link href="/menu" className="section-link">Full Menu →</Link>
          </div>
          <div className="product-grid">
            {items.slice(0, 8).map(item => <ProductCard key={item.id} item={item} />)}
          </div>
          {items.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🍜</div>
              <div className="empty-title">Our Menu is Being Prepared</div>
              <p className="empty-text">The chef is crafting something special. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* USP Banner */}
      <div className="container" style={{ marginTop: 'var(--sp-xl)' }}>
        <div className="card" style={{ padding: 'var(--sp-2xl)', textAlign: 'center', background: 'var(--primary-dark)', color: 'white', border: 'none' }}>
          <h3 style={{ color: 'white', marginBottom: 8 }}>Simple Ordering, Exceptional Food</h3>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto' }}>
            Browse our menu, add to cart, place your order. <strong style={{ color: 'white' }}>Pay cash when you collect.</strong> No accounts, no hassle.
          </p>
        </div>
      </div>
      <div style={{ height: 'var(--sp-2xl)' }} />
    </div>
  );
}
