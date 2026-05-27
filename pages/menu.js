import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductCard from '../components/ProductCard';

export default function Menu() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([fetch('/api/categories').then(r => r.json()), fetch('/api/menu-items').then(r => r.json())]);
        setCats(Array.isArray(c) ? c : []);
        setItems(Array.isArray(m) ? m : []);
        if (router.query.category) setActiveCat(parseInt(router.query.category));
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [router.query.category]);

  const filtered = items.filter(i => {
    const matchCat = !activeCat || i.category_id === activeCat;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return <div className="flex items-center justify-center" style={{ height: '60vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ paddingBottom: 'var(--sp-3xl)' }}>
      {/* Search & filters */}
      <div className="container" style={{ paddingTop: 'var(--sp-xl)' }}>
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--sp-lg)' }}>
          <input type="text" className="input" placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 44, borderRadius: 'var(--radius-full)' }} />
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
        </div>

        {/* Category chips */}
        <div className="categories">
          <button className={`chip${!activeCat ? ' active' : ''}`} onClick={() => setActiveCat(null)}>All</button>
          {cats.map(c => (
            <button key={c.id} className={`chip${activeCat === c.id ? ' active' : ''}`} onClick={() => setActiveCat(c.id)}>{c.name}</button>
          ))}
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 8 }}>
          {filtered.length} {filtered.length === 1 ? 'dish' : 'dishes'}
          {activeCat && ` in ${cats.find(c => c.id === activeCat)?.name}`}
        </p>
      </div>

      {/* Grid */}
      <div className="section" style={{ paddingTop: 'var(--sp-lg)' }}>
        <div className="product-grid">
          {filtered.map(item => <ProductCard key={item.id} item={item} />)}
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">{search ? 'Nothing Found' : 'Menu is Empty'}</div>
            <p className="empty-text">{search ? 'Try a different search.' : 'Dishes will appear here once added via the admin panel.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
