import { useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../components/CartContext';
import Link from 'next/link';

export default function Checkout() {
  const router = useRouter();
  const { items, totalPrice, clearCart, showToast } = useCart();
  const [form, setForm] = useState({ customer_name: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fmt = (p) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  const validate = () => {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Invalid';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate() || items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items: items.map(i => ({ menu_item_id: i.id, name: i.name, quantity: i.quantity, price: i.price })) }) });
      const d = await res.json();
      if (res.ok) { clearCart(); router.push(`/order/${d.tracking_code}?phone=${encodeURIComponent(form.phone)}`); }
      else showToast(d.error || 'Failed', 'error');
    } catch (err) { showToast('Connection error', 'error'); }
    setSubmitting(false);
  };

  if (items.length === 0 && !submitting) {
    return <div className="container" style={{ paddingTop: 'var(--sp-3xl)' }}><div className="empty-state"><div className="empty-icon">🛒</div><div className="empty-title">Cart is Empty</div><p className="empty-text">Add items before checkout.</p><Link href="/menu" className="btn btn-primary">Browse Menu</Link></div></div>;
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-xl)', paddingBottom: 'var(--sp-3xl)', maxWidth: 600 }}>
      <h2 style={{ marginBottom: 'var(--sp-xl)' }}>Checkout</h2>
      <div className="card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-xl)' }}>
        <h4 style={{ marginBottom: 'var(--sp-md)' }}>Order Summary</h4>
        <div className="flex-col gap-sm">
          {items.map(i => <div key={i.id} className="flex justify-between" style={{ fontSize: 'var(--text-sm)' }}><span>{i.quantity}x {i.name}</span><span>{fmt(i.price * i.quantity)}</span></div>)}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--sp-md)', paddingTop: 'var(--sp-md)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Total</span><span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--primary)' }}>{fmt(totalPrice)}</span>
        </div>
      </div>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 'var(--sp-base)' }}><label className="label">Full Name *</label><input className={`input${errors.customer_name ? ' error' : ''}`} style={errors.customer_name ? { borderColor: 'var(--error)' } : undefined} value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Your name" /></div>
        <div style={{ marginBottom: 'var(--sp-base)' }}><label className="label">Phone Number *</label><input className="input" style={errors.phone ? { borderColor: 'var(--error)' } : undefined} type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0900 123 456" /></div>
        <div style={{ marginBottom: 'var(--sp-base)' }}><label className="label">Delivery Address</label><input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, District 1" /></div>
        <div style={{ marginBottom: 'var(--sp-xl)' }}><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Allergies, special requests..." /></div>
        <button className="btn btn-primary btn-block btn-lg" disabled={submitting}>{submitting ? 'Processing...' : `Place Order — ${fmt(totalPrice)}`}</button>
        <p className="text-center" style={{ marginTop: 'var(--sp-base)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}><strong>Cash on delivery.</strong> No payment needed now.</p>
      </form>
    </div>
  );
}
