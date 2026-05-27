import { useCart } from './CartContext';

export default function ProductCard({ item }) {
  const { addItem, items } = useCart();
  const cartItem = items.find(i => i.id === item.id);
  const inCart = cartItem ? cartItem.quantity : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <div className="card card-elevated" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '260px',
    }}>
      {/* Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '80%',
        overflow: 'hidden',
        background: 'var(--color-surface-hover)',
      }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px',
            color: 'var(--color-text-muted)',
          }}>
            🍜
          </div>
        )}
        {inCart > 0 && (
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'var(--color-primary)',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
          }}>
            {inCart} in cart
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--sp-md) var(--sp-base)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          color: 'var(--color-text)',
          marginBottom: '4px',
          lineHeight: 1.3,
        }}>
          {item.name}
        </h4>
        {item.description && (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--sp-sm)',
            flex: 1,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {item.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
            {formatPrice(item.price)}
          </span>
          <button
            onClick={() => addItem(item)}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              width: '32px',
              height: '32px',
              fontSize: '18px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
