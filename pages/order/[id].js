import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrderDetail() {
  const router = useRouter();
  const { id, phone } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !phone) return;
    async function load() {
      try {
        const res = await fetch(`/api/orders/${id}?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (res.ok) {
          setOrder(data);
        } else {
          setError(data.error || 'Không tìm thấy đơn hàng');
        }
      } catch (e) {
        setError('Lỗi kết nối. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, phone]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const statusMap = {
    pending: { label: 'Chờ xác nhận', color: 'var(--warning-yellow)', bg: '#FFF9E6' },
    confirmed: { label: 'Đã xác nhận', color: 'var(--hyperlink-blue)', bg: '#E6EEFF' },
    paid: { label: 'Đã thanh toán', color: 'var(--sage-green)', bg: '#EDF5E6' },
    cancelled: { label: 'Đã hủy', color: 'var(--error-red)', bg: '#FFE6E6' },
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-56)', paddingBottom: 'var(--sp-56)', maxWidth: '500px' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-text">{error}</p>
          <Link href="/tracking" className="btn btn-primary">
            Thử lại
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const status = statusMap[order.status] || statusMap.pending;

  return (
    <div className="container" style={{
      paddingTop: 'var(--sp-32)',
      paddingBottom: 'var(--sp-56)',
      maxWidth: '700px',
    }}>
      <div style={{ marginBottom: 'var(--sp-24)' }}>
        <Link href="/tracking" style={{ fontSize: 'var(--fs-caption)', color: 'var(--hyperlink-blue)' }}>
          ← Quay lại
        </Link>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--sp-24)',
        flexWrap: 'wrap',
        gap: 'var(--sp-12)',
      }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 'var(--sp-4)' }}>
            Đơn hàng #{order.tracking_code}
          </h1>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--medium-gray)' }}>
            {new Date(order.created_at).toLocaleString('vi-VN')}
          </p>
        </div>
        <span className="badge-status" style={{
          background: status.bg,
          color: status.color,
          fontSize: 'var(--fs-body)',
          padding: '8px 16px',
        }}>
          {status.label}
        </span>
      </div>

      {/* Order Progress */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 'var(--sp-32)',
        padding: 'var(--sp-20)',
        background: 'var(--off-white)',
        borderRadius: 'var(--br-md)',
      }}>
        {['pending', 'confirmed', 'paid'].map((step, i) => {
          const s = statusMap[step];
          const isActive = order.status === step ||
            (step === 'confirmed' && order.status === 'paid') ||
            (step === 'pending' && (order.status === 'confirmed' || order.status === 'paid'));
          const isPast =
            (step === 'pending' && (order.status === 'confirmed' || order.status === 'paid' || order.status === 'cancelled')) ||
            (step === 'confirmed' && (order.status === 'paid')) ||
            (step === 'paid' && order.status === 'paid');

          return (
            <div key={step} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: isPast ? 'var(--sage-green)' : isActive ? 'var(--brand-red)' : 'var(--pale-gray)',
                color: 'var(--white)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', marginBottom: 'var(--sp-4)',
              }}>
                {isPast ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--dark-gray)' }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Details */}
      <div style={{ marginBottom: 'var(--sp-32)' }}>
        <h3 style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 400, marginBottom: 'var(--sp-12)' }}>
          Chi tiết đơn hàng
        </h3>
        <div className="flex-col gap-8">
          {order.items && order.items.map(item => (
            <div key={item.id} className="flex-between" style={{
              padding: 'var(--sp-12)',
              background: 'var(--off-white)',
              borderRadius: 'var(--br-sm)',
              fontSize: 'var(--fs-body)',
            }}>
              <span>
                <strong>{item.quantity}x</strong> {item.item_name}
              </span>
              <span style={{ fontWeight: 600 }}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-between" style={{
          marginTop: 'var(--sp-16)',
          paddingTop: 'var(--sp-16)',
          borderTop: '1px solid var(--pale-gray)',
          fontSize: 'var(--fs-body-lg)',
          fontWeight: 700,
        }}>
          <span>Tổng cộng</span>
          <span style={{ color: 'var(--brand-red)' }}>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{
        padding: 'var(--sp-20)',
        background: 'var(--off-white)',
        borderRadius: 'var(--br-md)',
        marginBottom: 'var(--sp-24)',
      }}>
        <h3 style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 400, marginBottom: 'var(--sp-12)' }}>
          Thông tin khách hàng
        </h3>
        <div className="flex-col gap-8" style={{ fontSize: 'var(--fs-body)' }}>
          <p><strong>Họ tên:</strong> {order.customer_name}</p>
          <p><strong>Số điện thoại:</strong> {order.phone}</p>
          {order.address && <p><strong>Địa chỉ:</strong> {order.address}</p>}
          {order.notes && <p><strong>Ghi chú:</strong> {order.notes}</p>}
        </div>
      </div>

      <p style={{
        fontSize: 'var(--fs-caption)',
        color: 'var(--medium-gray)',
        textAlign: 'center',
      }}>
        Lưu mã đơn hàng <strong>{order.tracking_code}</strong> để theo dõi đơn hàng sau này.
      </p>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
