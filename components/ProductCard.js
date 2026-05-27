import { useCart } from './CartContext';

export default function ProductCard({ item }) {
  const { addItem, items } = useCart();

  const cartItem = items.find(i => i.id === item.id);
  const inCart = cartItem ? cartItem.quantity : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <div className="card card-hover" style={{
      width: '100%',
      minHeight: '320px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        background: 'var(--off-white)',
      }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--lighter-gray)',
            fontSize: '48px',
          }}>
            🍜
          </div>
        )}
        {inCart > 0 && (
          <span className="badge-discount" style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
          }}>
            {inCart} trong giỏ
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{
        padding: 'var(--sp-16)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>
        <h3 style={{
          fontSize: 'var(--fs-body-lg)',
          fontWeight: 400,
          color: 'var(--charcoal-black)',
          marginBottom: 'var(--sp-4)',
          lineHeight: 'var(--lh-body-lg)',
        }}>
          {item.name}
        </h3>

        {item.description && (
          <p style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--medium-gray)',
            lineHeight: 'var(--lh-caption)',
            marginBottom: 'var(--sp-8)',
            flex: 1,
          }}>
            {item.description.length > 60 ? item.description.substring(0, 60) + '...' : item.description}
          </p>
        )}

        <div className="flex-between" style={{ marginTop: 'auto' }}>
          <span style={{
            fontSize: 'var(--fs-body-lg)',
            fontWeight: 700,
            color: 'var(--brand-red)',
          }}>
            {formatPrice(item.price)}
          </span>

          <button
            onClick={() => addItem(item)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', height: '36px', fontSize: '14px', minWidth: 'auto' }}
          >
            + Thêm
          </button>
        </div>
      </div>
    </div>
  );
}
