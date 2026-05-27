import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Tracking() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedPhone = phone.trim();
    if (!trimmedCode || !trimmedPhone) {
      setError('Please enter both your order code and phone number.');
      return;
    }
    if (!/^[0-9]{9,11}$/.test(trimmedPhone.replace(/\s/g, ''))) {
      setError('Invalid phone number.');
      return;
    }
    router.push(`/order/${trimmedCode}?phone=${encodeURIComponent(trimmedPhone)}`);
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-2xl)', paddingBottom: 'var(--sp-2xl)', maxWidth: '460px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--sp-2xl)' }}>
        <div style={{ fontSize: '56px', marginBottom: 'var(--sp-base)' }}>📦</div>
        <h1 className="section-title" style={{ textAlign: 'center' }}>Track Order</h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)' }}>
          Enter your order code and phone number to check your order status.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="code">Order Code</label>
          <input id="code" type="text" className="form-input"
            placeholder="e.g. ABC12345" value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            style={{ textTransform: 'uppercase' }} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Phone Number</label>
          <input id="phone" type="tel" className="form-input"
            placeholder="Phone used when ordering" value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }} />
        </div>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-base)',
            padding: 'var(--sp-md)', background: 'rgba(209,67,67,0.06)', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block btn-lg">
          Track Order
        </button>
      </form>
    </div>
  );
}
