import { useCart } from '../components/CartContext';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const fmt = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-3xl)' }}>
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Your Cart is Empty</div>
          <p className="empty-text">Discover our menu and add your favorites.</p>
          <Link href="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-xl)', paddingBottom: 'var(--sp-3xl)', maxWidth: 640 }}>
      <h2 style={{ marginBottom: 'var(--sp-xl)' }}>Your Cart</h2>
      <div className="flex-col gap-base" style={{ marginBottom: 'var(--sp-xl)' }}>
        {items.map(item => (
          <div key={item.id} className="card" style={{ padding: 'var(--sp-base)', display: 'flex', gap: 'var(--sp-base)', alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-warm)' }}>
              {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="flex items-center justify-center" style={{ width: '100%', height: '100%', fontSize: 24 }}>🍜</div>}
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{item.name}</h4>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600 }}>{fmt(item.price)}</span>
            </div>
            <div className="flex items-center gap-sm">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>−</button>
              <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
            </div>
            <button onClick={() => removeItem(item.id)} style={{ color: 'var(--text-muted)', padding: 4, cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 }}>✕</button>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 'var(--sp-xl)', marginBottom: 'var(--sp-lg)' }}>
        <div className="flex justify-between" style={{ marginBottom: 8 }}><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{fmt(totalPrice)}</span></div>
        <div className="flex justify-between" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}><span>Total</span><span style={{ color: 'var(--primary)' }}>{fmt(totalPrice)}</span></div>
      </div>
      <Link href="/checkout" className="btn btn-primary btn-block btn-lg">Proceed to Checkout</Link>
    </div>
  );
}
