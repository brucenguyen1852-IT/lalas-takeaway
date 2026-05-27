import { useCart } from './CartContext';

export default function ProductCard({ item }) {
  const { addItem, items } = useCart();
  const inCart = items.find(i => i.id === item.id)?.quantity || 0;
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  return (
    <div className="product-card">
      <div className="product-card-image">
        {item.image ? (
          <img src={item.image} alt={item.name} loading="lazy" />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'var(--text-muted)' }}>🍜</div>
        )}
        {inCart > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>{inCart}</span>
        )}
      </div>
      <div className="product-card-body">
        <h4 className="product-card-title">{item.name}</h4>
        {item.description && <p className="product-card-desc">{item.description.slice(0, 60)}{item.description.length > 60 ? '...' : ''}</p>}
        <div className="product-card-footer">
          <span className="product-card-price">{formatPrice(item.price)}</span>
          <button className="product-card-add" onClick={() => addItem(item)}>+</button>
        </div>
      </div>
    </div>
  );
}
