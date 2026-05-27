import { useState, useEffect } from 'react';
import Link from 'next/link';
import Banner from '../components/Banner';
import ProductCard from '../components/ProductCard';
import CategoryNav from '../components/CategoryNav';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
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
        console.error('Failed to load homepage data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const filteredItems = activeCategory
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems;

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Hero Banner */}
      {banners.length > 0 && (
        <section style={{ marginBottom: 'var(--sp-32)' }}>
          <Banner banner={banners[currentBanner]} />
          {banners.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-8)', marginTop: 'var(--sp-8)' }}>
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: i === currentBanner ? 'var(--brand-red)' : 'var(--pale-gray)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Hero section (when no banners) */}
      {banners.length === 0 && (
        <section style={{
          background: 'linear-gradient(135deg, var(--warm-cream), var(--warm-peach))',
          padding: 'var(--sp-56) 0',
          textAlign: 'center',
          marginBottom: 'var(--sp-32)',
        }}>
          <div className="container">
            <h1 style={{
              fontSize: 'var(--fs-display)',
              fontWeight: 400,
              lineHeight: 'var(--lh-display)',
              color: 'var(--charcoal-black)',
              marginBottom: 'var(--sp-16)',
            }}>
              {settings.site_name || "LaLa's Take Away"}
            </h1>
            <p style={{
              fontSize: 'var(--fs-body-lg)',
              color: 'var(--medium-gray)',
              marginBottom: 'var(--sp-24)',
            }}>
              {settings.site_description || 'Ẩm thực Việt Nam truyền thống'}
            </p>
            <Link href="/menu" className="btn btn-primary btn-lg">
              Xem thực đơn
            </Link>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section container">
          <div className="flex-between" style={{ marginBottom: 'var(--sp-12)' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Danh mục</h2>
            <Link href="/menu" style={{ fontSize: 'var(--fs-body)', color: 'var(--hyperlink-blue)' }}>
              Xem tất cả →
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 'var(--sp-16)',
          }}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/menu?category=${cat.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 'var(--sp-20) var(--sp-16)',
                  background: 'var(--white)',
                  borderRadius: 'var(--br-md)',
                  boxShadow: 'var(--shadow-card)',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: 'var(--sp-8)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--warm-cream)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: 'var(--sp-8)',
                  }}>
                    🍜
                  </div>
                )}
                <span style={{
                  fontSize: 'var(--fs-body)',
                  color: 'var(--charcoal-black)',
                  textAlign: 'center',
                }}>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Menu Items */}
      <section className="section container">
        <div className="flex-between" style={{ marginBottom: 'var(--sp-12)' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Món nổi bật</h2>
          <Link href="/menu" style={{ fontSize: 'var(--fs-body)', color: 'var(--hyperlink-blue)' }}>
            Xem thực đơn →
          </Link>
        </div>
        <div className="grid-4">
          {filteredItems.slice(0, 8).map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-text">Chưa có món nào. Truy cập Admin Bot để thêm món.</p>
          </div>
        )}
      </section>

      {/* Promotional Section */}
      <section className="section container">
        <div className="card-promo" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--sp-16)',
        }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 400, marginBottom: 'var(--sp-8)' }}>
              Đặt hàng nhanh chóng
            </h2>
            <p style={{ fontSize: 'var(--fs-body)', color: 'var(--medium-gray)', maxWidth: '500px' }}>
              Chỉ cần chọn món, điền thông tin và đặt hàng. Không cần tạo tài khoản.
              Thanh toán bằng tiền mặt khi nhận hàng.
            </p>
          </div>
          <Link href="/menu" className="btn btn-primary btn-lg">
            Đặt ngay
          </Link>
        </div>
      </section>
    </>
  );
}
