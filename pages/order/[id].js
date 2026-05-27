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
        if (res.ok) setOrder(data);
        else setError(data.error || 'Order not found.');
      } catch (e) {
        setError('Connection error. Please try again.');
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
    pending: { label: 'Pending', color: 'var(--color-warning)', bg: '#FFF8EC' },
    confirmed: { label: 'Confirmed', color: 'var(--color-info)', bg: '#ECF3FA' },
    paid: { label: 'Paid', color: 'var(--color-success)', bg: '#EDF5EC' },
    cancelled: { label: 'Cancelled', color: 'var(--color-error)', bg: '#FFECEC' },
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-2xl)', paddingBottom: 'var(--sp-2xl)', maxWidth: '460px' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">Order Not Found</div>
          <p className="empty-state-text">{error}</p>
          <Link href="/tracking" className="btn btn-primary">Try Again</Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const status = statusMap[order.status] || statusMap.pending;
  const steps = ['pending', 'confirmed', 'paid'];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-lg)', paddingBottom: 'var(--sp-2xl)', maxWidth: '600px' }}>
      <Link href="/tracking" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', display: 'inline-block', marginBottom: 'var(--sp-lg)' }}>
        ← Back
      </Link>

      <div style={{ marginBottom: 'var(--sp-xl)' }}>
        <h1 className="section-title" style={{ marginBottom: '4px' }}>Order #{order.tracking_code}</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          {new Date(order.created_at).toLocaleString('en-US')}
        </p>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 'var(--sp-xl)' }}>
        <span className="badge" style={{
          background: status.bg, color: status.color,
          fontSize: 'var(--text-base)', padding: '10px 20px',
        }}>{status.label}</span>
      </div>

      {/* Progress steps */}
      {order.status !== 'cancelled' && (
        <div className="order-steps">
          {steps.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            const s = statusMap[step];

            return (
              <div key={step} className={`order-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}>
                <div className="order-step-dot">
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className="order-step-label">{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Items */}
      <div className="card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-lg)' }}>
        <h4 style={{ marginBottom: 'var(--sp-md)' }}>Order Details</h4>
        <div className="flex-col gap-sm">
          {order.items && order.items.map(item => (
            <div key={item.id} className="flex-between" style={{
              padding: 'var(--sp-md)', background: 'var(--color-bg)',
              borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
            }}>
              <span><strong>{item.quantity}x</strong> {item.item_name}</span>
              <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex-between" style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--sp-md)', paddingTop: 'var(--sp-md)' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Customer info */}
      <div className="card" style={{ padding: 'var(--sp-lg)' }}>
        <h4 style={{ marginBottom: 'var(--sp-md)' }}>Customer Information</h4>
        <div className="flex-col gap-sm" style={{ fontSize: 'var(--text-sm)' }}>
          <p><strong>Name:</strong> {order.customer_name}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          {order.address && <p><strong>Address:</strong> {order.address}</p>}
          {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--sp-xl)' }}>
        Save your order code <strong>{order.tracking_code}</strong> for future reference.
      </p>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
