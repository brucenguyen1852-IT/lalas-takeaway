import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductCard from '../components/ProductCard';
import CategoryNav from '../components/CategoryNav';

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

        // Check for category query param
        if (router.query.category) {
          setActiveCategory(parseInt(router.query.category));
        }
      } catch (e) {
        console.error('Failed to load menu:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router.query.category]);

  const filteredItems = menuItems.filter(item => {
    const matchCategory = !activeCategory || item.category_id === activeCategory;
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-32)', paddingBottom: 'var(--sp-56)' }}>
      <h1 className="section-title">Thực đơn</h1>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--sp-24)', maxWidth: '400px' }}>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm món..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', paddingRight: '40px' }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--lighter-gray)"
          strokeWidth="2"
          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <CategoryNav
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      )}

      {/* Results count */}
      <p style={{
        fontSize: 'var(--fs-caption)',
        color: 'var(--medium-gray)',
        marginBottom: 'var(--sp-16)',
      }}>
        {filteredItems.length} món
        {activeCategory && ` trong danh mục "${categories.find(c => c.id === activeCategory)?.name}"`}
      </p>

      {/* Menu Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid-4">
          {filteredItems.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p className="empty-state-text">
            {search ? 'Không tìm thấy món nào phù hợp.' : 'Chưa có món nào trong thực đơn.'}
          </p>
        </div>
      )}
    </div>
  );
}
