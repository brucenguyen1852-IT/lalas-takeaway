import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Tracking() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const p = phone.trim();
    if (!c || !p) { setError('Please fill in both fields.'); return; }
    if (!/^[0-9]{9,11}$/.test(p.replace(/\s/g, ''))) { setError('Invalid phone number.'); return; }
    router.push(`/order/${c}?phone=${encodeURIComponent(p)}`);
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-3xl)', paddingBottom: 'var(--sp-3xl)', maxWidth: 440 }}>
      <div className="text-center" style={{ marginBottom: 'var(--sp-2xl)' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--sp-base)' }}>📦</div>
        <h2>Track Your Order</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Enter your order code and phone number.</p>
      </div>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 'var(--sp-base)' }}><label className="label">Order Code</label><input className="input" value={code} onChange={e => { setCode(e.target.value); setError(''); }} placeholder="e.g. AB12CD34" style={{ textTransform: 'uppercase' }} /></div>
        <div style={{ marginBottom: 'var(--sp-lg)' }}><label className="label">Phone Number</label><input className="input" type="tel" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} placeholder="Phone used when ordering" /></div>
        {error && <div style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-base)', padding: 'var(--sp-md)', background: 'rgba(197,85,74,0.06)', borderRadius: 'var(--radius-md)' }}>{error}</div>}
        <button className="btn btn-primary btn-block btn-lg">Track Order</button>
      </form>
    </div>
  );
}
