import { useCart } from './CartContext';
import Link from 'next/link';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-400px',
        width: '100%',
        maxWidth: '400px',
        height: '100vh',
        background: 'var(--white)',
        boxShadow: 'var(--shadow-modal)',
        zIndex: 201,
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div className="flex-between" style={{
          padding: 'var(--sp-16) var(--sp-20)',
          borderBottom: '1px solid var(--pale-gray)',
        }}>
          <h2 style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 400 }}>
            Giỏ hàng ({items.length})
          </h2>
          <button onClick={closeCart} className="btn-icon" style={{ fontSize: '20px', width: '32px', height: '32px' }}>
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-16)' }}>
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <p className="empty-state-text">Giỏ hàng trống</p>
              <Link href="/menu" onClick={closeCart} className="btn btn-primary">
                Xem thực đơn
              </Link>
            </div>
          ) : (
            <div className="flex-col gap-16">
              {items.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: 'var(--sp-12)',
                  padding: 'var(--sp-12)',
                  border: '1px solid var(--pale-gray)',
                  borderRadius: 'var(--br-md)',
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--br-sm)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--off-white)',
                  }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        🍜
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 400, marginBottom: '4px' }}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--brand-red)', fontWeight: 700 }}>
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--lighter-gray)',
                        cursor: 'pointer', fontSize: '16px', padding: '2px',
                      }}
                    >
                      ✕
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={qtyBtnStyle}
                      >
                        −
                      </button>
                      <span style={{ fontSize: 'var(--fs-body)', minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={qtyBtnStyle}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: 'var(--sp-16) var(--sp-20)',
            borderTop: '1px solid var(--pale-gray)',
          }}>
            <div className="flex-between" style={{ marginBottom: 'var(--sp-12)' }}>
              <span style={{ fontSize: 'var(--fs-body-lg)' }}>Tổng cộng:</span>
              <span style={{ fontSize: 'var(--fs-h3)', fontWeight: 700, color: 'var(--brand-red)' }}>
                {formatPrice(totalPrice)}
              </span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="btn btn-primary btn-full">
              Đặt hàng
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

const qtyBtnStyle = {
  width: '24px',
  height: '24px',
  border: '1px solid var(--pale-gray)',
  background: 'var(--white)',
  borderRadius: 'var(--br-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
};
