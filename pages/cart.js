import { useCart } from '../components/CartContext';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-lg)', paddingBottom: 'var(--sp-2xl)' }}>
      <h1 className="section-title">Your Cart</h1>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">Cart is empty</div>
          <p className="empty-state-text">Browse our menu and add some delicious dishes.</p>
          <Link href="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      ) : (
        <>
          <div className="flex-col gap-base" style={{ marginBottom: 'var(--sp-xl)' }}>
            {items.map(item => (
              <div key={item.id} className="card" style={{
                display: 'flex',
                gap: 'var(--sp-md)',
                padding: 'var(--sp-md)',
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-hover)',
                }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🍜</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 500, marginBottom: '2px' }}>{item.name}</h4>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {formatPrice(item.price)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button onClick={() => removeItem(item.id)} style={{
                    background: 'none', border: 'none', color: 'var(--color-text-muted)',
                    fontSize: '16px', padding: '4px', cursor: 'pointer',
                  }}>✕</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={qtyBtnStyle}>−</button>
                    <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={qtyBtnStyle}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--sp-sm)' }}>
              <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)' }}>Subtotal</span>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary)' }}>{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <Link href="/checkout" className="btn btn-primary btn-block btn-lg">
            Proceed to Checkout — {formatPrice(totalPrice)}
          </Link>
        </>
      )}
    </div>
  );
}

const qtyBtnStyle = {
  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
  fontSize: '16px', fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--color-text)',
};
