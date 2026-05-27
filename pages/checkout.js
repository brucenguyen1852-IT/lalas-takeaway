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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const validate = () => {
    const errs = {};
    if (!form.customer_name.trim()) errs.customer_name = 'Please enter your name';
    if (!form.phone.trim()) errs.phone = 'Please enter your phone number';
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || items.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map(i => ({
            menu_item_id: i.id, name: i.name,
            quantity: i.quantity, price: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        clearCart();
        router.push(`/order/${data.tracking_code}?phone=${encodeURIComponent(form.phone)}`);
      } else {
        showToast(data.error || 'Order failed. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (items.length === 0 && !submitting) {
    return (
      <div className="container" style={{ paddingTop: 'var(--sp-2xl)', paddingBottom: 'var(--sp-2xl)' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">Cart is empty</div>
          <p className="empty-state-text">Add items to your cart before checking out.</p>
          <Link href="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-lg)', paddingBottom: 'var(--sp-2xl)', maxWidth: '600px' }}>
      <h1 className="section-title">Checkout</h1>

      {/* Order Summary */}
      <div className="card" style={{ padding: 'var(--sp-lg)', marginBottom: 'var(--sp-xl)' }}>
        <h4 style={{ marginBottom: 'var(--sp-md)' }}>Order Summary</h4>
        <div className="flex-col gap-sm">
          {items.map(item => (
            <div key={item.id} className="flex-between" style={{ fontSize: 'var(--text-sm)' }}>
              <span>{item.quantity}x {item.name}</span>
              <span style={{ fontWeight: 500 }}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--sp-md)', paddingTop: 'var(--sp-md)' }}>
          <div className="flex-between">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full Name *</label>
          <input id="name" type="text" className={`form-input ${errors.customer_name ? 'error' : ''}`}
            placeholder="John Doe" value={form.customer_name} onChange={handleChange('customer_name')} />
          {errors.customer_name && <span style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.customer_name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone Number *</label>
          <input id="phone" type="tel" className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="0900 123 456" value={form.phone} onChange={handleChange('phone')} />
          {errors.phone && <span style={{ color: 'var(--color-error)', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="address">Delivery Address</label>
          <input id="address" type="text" className="form-input"
            placeholder="123 Main Street, District 1" value={form.address} onChange={handleChange('address')} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="notes">Notes</label>
          <textarea id="notes" className="form-input"
            placeholder="Allergies, special requests..." value={form.notes} onChange={handleChange('notes')} rows={3} />
        </div>

        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
          {submitting ? (
            <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: 'white' }} /> Processing...</>
          ) : (
            `Place Order — ${formatPrice(totalPrice)}`
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--sp-base)' }}>
          <strong>Cash on delivery.</strong> No payment needed upfront.
        </p>
      </form>
    </div>
  );
}
