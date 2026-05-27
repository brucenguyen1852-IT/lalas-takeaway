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
      setError('Vui lòng nhập mã đơn hàng và số điện thoại');
      return;
    }
    if (!/^[0-9]{9,11}$/.test(trimmedPhone.replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ');
      return;
    }

    router.push(`/order/${trimmedCode}?phone=${encodeURIComponent(trimmedPhone)}`);
  };

  return (
    <div className="container" style={{
      paddingTop: 'var(--sp-56)',
      paddingBottom: 'var(--sp-56)',
      maxWidth: '500px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--sp-32)' }}>
        <div style={{ fontSize: '48px', marginBottom: 'var(--sp-16)' }}>📦</div>
        <h1 className="section-title">Theo dõi đơn hàng</h1>
        <p style={{ fontSize: 'var(--fs-body)', color: 'var(--medium-gray)' }}>
          Nhập mã đơn hàng và số điện thoại để kiểm tra trạng thái
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="code">Mã đơn hàng</label>
          <input
            id="code"
            type="text"
            className="form-input"
            placeholder="VD: ABC12345"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            type="tel"
            className="form-input"
            placeholder="Số điện thoại đã dùng khi đặt hàng"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }}
          />
        </div>

        {error && (
          <div style={{
            color: 'var(--error-red)',
            fontSize: 'var(--fs-caption)',
            marginBottom: 'var(--sp-12)',
            padding: 'var(--sp-8) var(--sp-12)',
            background: 'rgba(254, 62, 62, 0.05)',
            borderRadius: 'var(--br-md)',
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full">
          Kiểm tra đơn hàng
        </button>
      </form>
    </div>
  );
}
