import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductCard from '../components/ProductCard';

export default function Menu() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, mRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu-items'),
        ]);
        const [cData, mData] = await Promise.all([cRes.json(), mRes.json()]);
        setCategories(Array.isArray(cData) ? cData : []);
        setMenuItems(Array.isArray(mData) ? mData : []);
        if (router.query.category) setActiveCategory(parseInt(router.query.category));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router.query.category]);

  const filteredItems = menuItems.filter(item => {
    const matchCat = !activeCategory || item.category_id === activeCategory;
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  if (loading) {
    return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  }

  return (
    <div style={{ paddingTop: 'var(--sp-base)', paddingBottom: 'var(--sp-2xl)' }}>
      {/* Search */}
      <div className="container" style={{ position: 'relative', marginBottom: 'var(--sp-base)' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search dishes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--color-text-muted)' }}>
          🔍
        </span>
      </div>

      {/* Category chips */}
      <div className="container">
        <div style={{
          display: 'flex', gap: 'var(--sp-sm)', overflowX: 'auto',
          padding: 'var(--sp-sm) 0 var(--sp-base)', WebkitOverflowScrolling: 'touch',
        }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              ...chipStyle,
              background: !activeCategory ? 'var(--color-primary)' : 'var(--color-surface)',
              color: !activeCategory ? 'white' : 'var(--color-text)',
              border: !activeCategory ? 'none' : '1px solid var(--color-border)',
            }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                ...chipStyle,
                background: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeCategory === cat.id ? 'white' : 'var(--color-text)',
                border: activeCategory === cat.id ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--sp-base)' }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'}
          {activeCategory && ` in "${categories.find(c => c.id === activeCategory)?.name}"`}
        </p>
      </div>

      {/* Product grid */}
      <div className="product-grid">
        {filteredItems.map(item => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
      {filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <div className="empty-state-title">{search ? 'No results' : 'Menu is empty'}</div>
          <p className="empty-state-text">
            {search ? 'Try a different search term.' : 'Check back soon for new dishes.'}
          </p>
        </div>
      )}

      <style jsx>{`::-webkit-scrollbar { height: 0; }`}</style>
    </div>
  );
}

const chipStyle = {
  padding: '10px 18px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all var(--transition-fast)',
  fontFamily: 'var(--font-body)',
  minHeight: '40px',
};
