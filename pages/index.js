import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [bRes, cRes, mRes, sRes] = await Promise.all([
          fetch('/api/banners'),
          fetch('/api/categories'),
          fetch('/api/menu-items'),
          fetch('/api/settings'),
        ]);
        const [bData, cData, mData, sData] = await Promise.all([
          bRes.json(), cRes.json(), mRes.json(), sRes.json(),
        ]);
        setBanners(Array.isArray(bData) ? bData : []);
        setCategories(Array.isArray(cData) ? cData : []);
        setMenuItems(Array.isArray(mData) ? mData : []);
        setSettings(sData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* Hero */}
      {banners.length > 0 ? (
        <div className="hero" style={{ backgroundImage: banners[currentBanner].image ? `url(${banners[currentBanner].image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">{banners[currentBanner].title || "LaLa's Take Away"}</h1>
            <p className="hero-subtitle">{settings.site_description || 'Authentic Vietnamese Cuisine'}</p>
            <Link href="/menu" className="btn btn-gold btn-lg">View Menu</Link>
          </div>
        </div>
      ) : (
        <div className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">LaLa's Take Away</h1>
            <p className="hero-subtitle">{settings.site_description || 'Authentic Vietnamese Cuisine'}</p>
            <Link href="/menu" className="btn btn-gold btn-lg">View Menu</Link>
          </div>
        </div>
      )}
      {banners.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '-24px', position: 'relative', zIndex: 2, paddingBottom: 'var(--sp-base)' }}>
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrentBanner(i)} style={{
              width: i === currentBanner ? '20px' : '8px', height: '8px',
              borderRadius: '4px', border: 'none', background: i === currentBanner ? 'var(--color-primary)' : 'var(--color-border)',
              cursor: 'pointer', transition: 'all var(--transition-base)', padding: 0,
            }} />
          ))}
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Categories</h2>
              <Link href="/menu" className="section-link">See All</Link>
            </div>
            <div style={{
              display: 'flex', gap: 'var(--sp-md)', overflowX: 'auto',
              padding: 'var(--sp-sm) 0', scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}>
              {categories.map(cat => (
                <Link key={cat.id} href={`/menu?category=${cat.id}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: 'var(--sp-base) var(--sp-lg)',
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)', textDecoration: 'none',
                  scrollSnapAlign: 'start', minWidth: '100px',
                  border: '1px solid var(--color-border-light)',
                }}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', marginBottom: 'var(--sp-sm)' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: 'var(--sp-sm)' }}>🍜</div>
                  )}
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)', textAlign: 'center' }}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Items */}
      <div className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Dishes</h2>
            <Link href="/menu" className="section-link">See Menu</Link>
          </div>
          <div className="product-grid">
            {menuItems.slice(0, 8).map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
          {menuItems.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-title">Menu Coming Soon</div>
              <p className="empty-state-text">Our chef is preparing something special.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="container">
        <div className="card card-gold" style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: 'var(--sp-sm)' }}>How to Order</h3>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto' }}>
            Browse the menu, add items to your cart, fill in your details, and we'll prepare your order.
            <strong> Cash on delivery.</strong> No account needed.
          </p>
        </div>
      </div>

      <div style={{ height: 'var(--sp-2xl)' }} />
    </div>
  );
}
