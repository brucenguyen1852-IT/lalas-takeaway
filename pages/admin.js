import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';

const API = '/api/admin';
const ADMIN_PASSWORD = 'lala2024admin';

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ items: [], categories: [], banners: [], orders: [], revenue: [], settings: {} });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const fileRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [items, cats, banners, orders, settings] = await Promise.all([
        fetch('/api/menu-items').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/banners').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
      ]);
      setData({ items: Array.isArray(items) ? items : [], categories: Array.isArray(cats) ? cats : [], banners: Array.isArray(banners) ? banners : [], orders: Array.isArray(orders) ? orders : [], settings: settings || {} });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (loggedIn) fetchData(); }, [loggedIn, fetchData]);
  useEffect(() => { if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth') === 'true') setLoggedIn(true); }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setLoggedIn(true); setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const uploadImage = async (file) => {
    const form = new FormData(); form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const d = await res.json();
    if (res.ok) return d.path;
    throw new Error(d.error || 'Upload failed');
  };

  const handleSave = async (type, formData, id) => {
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(`${API}/${type}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { ...formData, id } : formData),
    });
    if (res.ok) {
      showToast(id ? 'Updated!' : 'Created!');
      setModal(null); fetchData();
    } else {
      const d = await res.json(); showToast(d.error || 'Error', 'error');
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`${API}/${type}?id=${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Deleted!'); fetchData(); }
  };

  const handleOrderAction = async (orderId, status) => {
    await fetch(`${API}/orders`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    });
    fetchData(); showToast(`Order ${status}!`);
  };

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h1 className="login-title">LaLa's Admin</h1>
          <form onSubmit={handleLogin}>
            <label className="label" style={{ marginBottom: 8 }}>Password</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter admin password" autoFocus />
            {loginError && <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginTop: 8 }}>{loginError}</p>}
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'items', label: 'Menu Items', icon: '🍜' },
    { key: 'categories', label: 'Categories', icon: '📂' },
    { key: 'banners', label: 'Banners', icon: '🖼' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const sidebar = (
    <div className="admin-sidebar">
      <div className="admin-sidebar-title">LaLa's Admin</div>
      {tabs.map(t => (
        <button key={t.key} className={`admin-sidebar-link${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
          <span>{t.icon}</span> {t.label}
        </button>
      ))}
      <div style={{ marginTop: 'auto' }}>
        <button className="admin-sidebar-link" onClick={() => { sessionStorage.removeItem('admin_auth'); setLoggedIn(false); }}>🚪 Logout</button>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center" style={{ height: '100vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Head><title>Admin — LaLa's Take Away</title></Head>

      {/* Sidebar */}
      {sidebar}

      {/* Mobile nav */}
      <div style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--primary-dark)', zIndex: 50, padding: '8px', overflowX: 'auto' }} className="admin-mobile-nav">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '8px 12px', color: tab === t.key ? 'white' : 'rgba(255,255,255,0.6)', fontSize: '12px', background: tab === t.key ? 'var(--primary)' : 'transparent', borderRadius: 'var(--radius-md)', border: 'none', whiteSpace: 'nowrap' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="admin-main" style={{ paddingBottom: '100px' }}>
        {/* Toast */}
        {toast && <div className="admin-toast" style={{ background: toast.type === 'error' ? 'var(--error)' : 'var(--success)' }}>{toast.msg}</div>}

        {tab === 'dashboard' && <Dashboard data={data} />}
        {tab === 'orders' && <OrdersTab orders={data.orders} onAction={handleOrderAction} />}
        {tab === 'items' && <ItemsTab items={data.items} categories={data.categories} onSave={handleSave} onDelete={handleDelete} uploadImage={uploadImage} />}
        {tab === 'categories' && <CategoriesTab categories={data.categories} onSave={handleSave} onDelete={handleDelete} uploadImage={uploadImage} />}
        {tab === 'banners' && <BannersTab banners={data.banners} onSave={handleSave} onDelete={handleDelete} uploadImage={uploadImage} />}
        {tab === 'settings' && <SettingsTab settings={data.settings} onSave={handleSave} uploadImage={uploadImage} />}
      </div>

      <style jsx>{`@media (max-width: 767px) { .admin-mobile-nav { display: flex !important; } }`}</style>
    </div>
  );
}

function Dashboard({ data }) {
  const pendingOrders = data.orders.filter(o => o.status === 'pending').length;
  const paidOrders = data.orders.filter(o => o.status === 'paid');
  const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  return (
    <div>
      <div className="admin-header"><h2>Dashboard</h2></div>
      <div className="admin-grid" style={{ marginBottom: 'var(--sp-xl)' }}>
        <div className="admin-stat"><div className="admin-stat-value">{data.items.length}</div><div className="admin-stat-label">Menu Items</div></div>
        <div className="admin-stat"><div className="admin-stat-value">{data.categories.length}</div><div className="admin-stat-label">Categories</div></div>
        <div className="admin-stat"><div className="admin-stat-value">{pendingOrders}</div><div className="admin-stat-label">Pending Orders</div></div>
        <div className="admin-stat"><div className="admin-stat-value">{formatPrice(revenue)}</div><div className="admin-stat-label">Revenue (All Time)</div></div>
      </div>
      <div className="admin-card">
        <h4 style={{ marginBottom: 16 }}>Recent Orders</h4>
        {data.orders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p> : (
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.orders.slice(0, 10).map(o => (
                <tr key={o.id}>
                  <td><strong>#{o.tracking_code}</strong></td>
                  <td>{o.customer_name}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><span className={`badge ${o.status === 'paid' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : o.status === 'cancelled' ? 'badge-error' : 'badge-primary'}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ orders, onAction }) {
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';
  return (
    <div>
      <div className="admin-header"><h2>Orders</h2></div>
      <div className="admin-card">
        {orders.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Code</th><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.tracking_code}</strong></td>
                    <td>{o.customer_name}</td>
                    <td>{o.phone}</td>
                    <td>{o.items ? o.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ') : ''}</td>
                    <td><strong>{formatPrice(o.total)}</strong></td>
                    <td><span className={`badge ${o.status === 'paid' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : o.status === 'confirmed' ? 'badge-primary' : 'badge-error'}`}>{o.status}</span></td>
                    <td>
                      <div className="flex gap-sm">
                        {o.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => onAction(o.id, 'confirmed')}>Confirm</button>}
                        {(o.status === 'pending' || o.status === 'confirmed') && <button className="btn btn-sm btn-accent" onClick={() => onAction(o.id, 'paid')}>Paid</button>}
                        {o.status !== 'cancelled' && o.status !== 'paid' && <button className="btn btn-sm btn-outline" onClick={() => onAction(o.id, 'cancelled')}>Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemsTab({ items, categories, onSave, onDelete, uploadImage }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', image: '', active: true, sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const openModal = (item) => {
    if (item) {
      setEditId(item.id);
      setForm({ name: item.name, description: item.description || '', price: String(item.price), category_id: String(item.category_id || ''), image: item.image || '', active: item.active, sort_order: item.sort_order });
    } else {
      setEditId(null);
      setForm({ name: '', description: '', price: '', category_id: '', image: '', active: true, sort_order: 0 });
    }
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadImage(file);
      setForm(f => ({ ...f, image: path }));
    } catch (err) { alert('Upload failed'); }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave('menu-items', { ...form, price: parseFloat(form.price), category_id: form.category_id ? parseInt(form.category_id) : null, active: form.active }, editId);
    setShowModal(false);
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  return (
    <div>
      <div className="admin-header">
        <h2>Menu Items ({items.length})</h2>
        <button className="btn btn-primary" onClick={() => openModal(null)}>+ Add Item</button>
      </div>
      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.image ? <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} /> : '—'}</td>
                <td><strong>{item.name}</strong></td>
                <td>{item.category_name || '—'}</td>
                <td>{formatPrice(item.price)}</td>
                <td><span className={`badge ${item.active ? 'badge-success' : 'badge-outline'}`}>{item.active ? 'Active' : 'Hidden'}</span></td>
                <td>
                  <div className="flex gap-sm">
                    <button className="btn btn-sm btn-ghost" onClick={() => openModal(item)}>Edit</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }} onClick={() => onDelete('menu-items', item.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Item' : 'New Item'}</h3>
            <form onSubmit={handleSubmit} className="flex-col gap-base">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="label">Description</label><textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div><label className="label">Price (VND)</label><input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></div>
              <div><label className="label">Category</label>
                <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">None</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="img-preview" onClick={() => fileRef.current?.click()}>
                    {form.image ? <img src={form.image} alt="" /> : <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>+</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{uploading ? 'Uploading...' : 'Click to upload'}</span>
                </div>
              </div>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  Active (visible on website)
                </label>
              </div>
              <div className="flex gap-base" style={{ marginTop: 8 }}>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesTab({ categories, onSave, onDelete, uploadImage }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', image: '', active: true, sort_order: 0 });
  const fileRef = useRef(null);

  const openModal = (cat) => {
    if (cat) { setEditId(cat.id); setForm({ name: cat.name, image: cat.image || '', active: cat.active, sort_order: cat.sort_order }); }
    else { setEditId(null); setForm({ name: '', image: '', active: true, sort_order: 0 }); }
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const path = await uploadImage(file); setForm(f => ({ ...f, image: path })); } catch (err) { alert('Upload failed'); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>Categories ({categories.length})</h2>
        <button className="btn btn-primary" onClick={() => openModal(null)}>+ Add Category</button>
      </div>
      <div className="admin-card">
        <div className="admin-grid">
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ padding: 16 }}>
              <div className="flex items-center gap-base">
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-warm)' }}>
                  {cat.image ? <img src={cat.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="flex items-center justify-center" style={{ width: '100%', height: '100%' }}>📂</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{cat.name}</strong>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{cat.active ? 'Active' : 'Hidden'}</div>
                </div>
                <div className="flex gap-sm">
                  <button className="btn btn-sm btn-ghost" onClick={() => openModal(cat)}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }} onClick={() => onDelete('categories', cat.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); onSave('categories', form, editId); setShowModal(false); }} className="flex-col gap-base">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div>
                <label className="label">Image</label>
                <div className="flex items-center gap-base">
                  <div className="img-preview" onClick={() => fileRef.current?.click()}>
                    {form.image ? <img src={form.image} alt="" /> : <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>+</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </div>
              </div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /> Active
              </label>
              <div className="flex gap-base"><button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create'}</button><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BannersTab({ banners, onSave, onDelete, uploadImage }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', image: '', link: '', active: true, sort_order: 0 });
  const fileRef = useRef(null);

  const openModal = (b) => {
    if (b) { setEditId(b.id); setForm({ title: b.title || '', image: b.image || '', link: b.link || '', active: b.active, sort_order: b.sort_order }); }
    else { setEditId(null); setForm({ title: '', image: '', link: '', active: true, sort_order: 0 }); }
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const path = await uploadImage(file); setForm(f => ({ ...f, image: path })); } catch (err) { alert('Upload failed'); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>Banners ({banners.length})</h2>
        <button className="btn btn-primary" onClick={() => openModal(null)}>+ Add Banner</button>
      </div>
      <div className="admin-card">
        <div className="admin-grid">
          {banners.map(b => (
            <div key={b.id} className="card">
              <div style={{ height: 150, background: 'var(--bg-warm)', overflow: 'hidden' }}>
                {b.image ? <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', color: 'var(--text-muted)' }}>No Image</div>}
              </div>
              <div style={{ padding: 16 }}>
                <strong>{b.title || 'Untitled'}</strong>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{b.active ? 'Active' : 'Hidden'}</div>
                <div className="flex gap-sm" style={{ marginTop: 8 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => openModal(b)}>Edit</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }} onClick={() => onDelete('banners', b.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Banner' : 'New Banner'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); onSave('banners', form, editId); setShowModal(false); }} className="flex-col gap-base">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="label">Link</label><input className="input" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/menu" /></div>
              <div>
                <label className="label">Image (required)</label>
                <div className="flex items-center gap-base">
                  <div className="img-preview" onClick={() => fileRef.current?.click()}>
                    {form.image ? <img src={form.image} alt="" /> : <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>+</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </div>
              </div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /> Active
              </label>
              <div className="flex gap-base"><button type="submit" className="btn btn-primary" disabled={!form.image}>{editId ? 'Update' : 'Create'}</button><button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ settings, onSave, uploadImage }) {
  const [form, setForm] = useState(settings);
  const fileRef = useRef(null);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const path = await uploadImage(file); setForm(f => ({ ...f, logo: path })); } catch (err) { alert('Upload failed'); }
  };

  const fields = [
    { key: 'site_name', label: 'Site Name' },
    { key: 'site_description', label: 'Site Description' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'hours', label: 'Opening Hours' },
  ];

  return (
    <div>
      <div className="admin-header"><h2>Settings</h2></div>
      <div className="admin-card" style={{ maxWidth: 600 }}>
        <form onSubmit={(e) => { e.preventDefault(); onSave('settings', form); }} className="flex-col gap-base">
          {fields.map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input className="input" value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-base">
              <div className="img-preview" onClick={() => fileRef.current?.click()}>
                {form.logo ? <img src={form.logo} alt="" /> : <span style={{ fontSize: 24, color: 'var(--text-muted)' }}>+</span>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              {form.logo && <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }} onClick={() => setForm(f => ({ ...f, logo: '' }))}>Remove</button>}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>Save Settings</button>
        </form>
      </div>
    </div>
  );
}
