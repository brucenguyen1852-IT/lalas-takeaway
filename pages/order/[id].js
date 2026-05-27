import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrderDetail() {
  const router = useRouter();
  const { id, phone } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fmt = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  useEffect(() => {
    if (!id || !phone) return;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${id}?phone=${encodeURIComponent(phone)}`);
        const d = await res.json();
        if (res.ok) setOrder(d); else setError(d.error || 'Order not found');
      } catch (e) { setError('Connection error'); }
      setLoading(false);
    })();
  }, [id, phone]);

  const statuses = {
    pending: { label: 'Pending', color: 'var(--warning)' },
    confirmed: { label: 'Confirmed', color: 'var(--primary)' },
    paid: { label: 'Paid', color: 'var(--success)' },
    cancelled: { label: 'Cancelled', color: 'var(--error)' },
  };

  if (loading) return <div className="flex items-center justify-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  if (error) return <div className="container" style={{ paddingTop: 'var(--sp-3xl)', maxWidth: 440 }}><div className="empty-state"><div className="empty-icon">🔍</div><div className="empty-title">Not Found</div><p className="empty-text">{error}</p><Link href="/tracking" className="btn btn-primary">Try Again</Link></div></div>;
  if (!order) return null;

  const s = statuses[order.status] || statuses.pending;
  const steps = ['pending', 'confirmed', 'paid'];
  const stepIdx = steps.indexOf(order.status);

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-xl)', paddingBottom: 'var(--sp-3xl)', maxWidth: 600 }}>
      <Link href="/tracking" style={{ display: 'inline-block', marginBottom: 'var(--sp-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>← Back to Tracking</Link>

      <div className="flex justify-between" style={{ marginBottom: 'var(--sp-xl)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Order #{order.tracking_code}</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{new Date(order.created_at).toLocaleString('en-US')}</p>
        </div>
        <span className="badge" style={{ background: s.color, color: 'white', fontSize: 'var(--text-sm)', padding: '8px 16px' }}>{s.label}</span>
      </div>

      {order.status !== 'cancelled' && (
        <div className="steps" style={{ marginBottom: 'var(--sp-xl)' }}>
          {steps.map((step, i) => (
            <div key={step} className={`step${i === stepIdx ? ' active' : ''}${i < stepIdx ? ' completed' : ''}`}>
              <div className="step-dot">{i < stepIdx ? '✓' : i + 1}</div>
              <span className="step-label">{statuses[step].label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 'var(--sp-xl)', marginBottom: 'var(--sp-lg)' }}>
        <h4 style={{ marginBottom: 'var(--sp-md)' }}>Items</h4>
        <div className="flex-col gap-sm">
          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between" style={{ padding: 'var(--sp-md)', background: 'var(--bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
              <span><strong>{item.quantity}x</strong> {item.item_name}</span>
              <span style={{ fontWeight: 600 }}>{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between" style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--sp-md)', paddingTop: 'var(--sp-md)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>
          <span>Total</span><span style={{ color: 'var(--primary)' }}>{fmt(order.total)}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--sp-xl)' }}>
        <h4 style={{ marginBottom: 'var(--sp-md)' }}>Customer Details</h4>
        <div className="flex-col gap-sm" style={{ fontSize: 'var(--text-sm)' }}>
          <p><strong>Name:</strong> {order.customer_name}</p>
          <p><strong>Phone:</strong> {order.phone}</p>
          {order.address && <p><strong>Address:</strong> {order.address}</p>}
          {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
        </div>
      </div>

      <p className="text-center" style={{ marginTop: 'var(--sp-xl)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        Save code <strong>{order.tracking_code}</strong> to track your order anytime.
      </p>
    </div>
  );
}

export async function getServerSideProps() { return { props: {} }; }
