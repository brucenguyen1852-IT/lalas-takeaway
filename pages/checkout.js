import { useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../components/CartContext';
import Link from 'next/link';

export default function Checkout() {
  const router = useRouter();
  const { items, totalPrice, clearCart, showToast } = useCart();
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const validate = () => {
    const errs = {};
    if (!form.customer_name.trim()) errs.customer_name = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, '')))
      errs.phone = 'Số điện thoại không hợp lệ';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (items.length === 0) {
      showToast('Giỏ hàng trống', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map(i => ({
            menu_item_id: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        router.push(`/order/${data.tracking_code}?phone=${encodeURIComponent(form.phone)}`);
      } else {
        showToast(data.error || 'Đặt hàng thất bại', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
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
      <div className="container" style={{ paddingTop: 'var(--sp-56)', paddingBottom: 'var(--sp-56)' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <p className="empty-state-text">Giỏ hàng trống</p>
          <Link href="/menu" className="btn btn-primary">
            Xem thực đơn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-32)', paddingBottom: 'var(--sp-56)', maxWidth: '800px' }}>
      <h1 className="section-title">Đặt hàng</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-32)', alignItems: 'start' }}
        className="checkout-grid">

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Họ và tên *</label>
            <input
              id="name"
              type="text"
              className={`form-input ${errors.customer_name ? 'error' : ''}`}
              placeholder="Nguyễn Văn A"
              value={form.customer_name}
              onChange={handleChange('customer_name')}
            />
            {errors.customer_name && (
              <span style={{ color: 'var(--error-red)', fontSize: '12px', marginTop: '4px' }}>
                {errors.customer_name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Số điện thoại *</label>
            <input
              id="phone"
              type="tel"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              placeholder="0900 123 456"
              value={form.phone}
              onChange={handleChange('phone')}
            />
            {errors.phone && (
              <span style={{ color: 'var(--error-red)', fontSize: '12px', marginTop: '4px' }}>
                {errors.phone}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">Địa chỉ giao hàng</label>
            <input
              id="address"
              type="text"
              className="form-input"
              placeholder="123 Đường ABC, Quận 1"
              value={form.address}
              onChange={handleChange('address')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">Ghi chú</label>
            <textarea
              id="notes"
              className="form-input"
              placeholder="Ghi chú về đơn hàng, dị ứng, yêu cầu đặc biệt..."
              value={form.notes}
              onChange={handleChange('notes')}
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
            style={{ marginTop: 'var(--sp-12)' }}
          >
            {submitting ? (
              <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Đang xử lý...</>
            ) : (
              `Đặt hàng - ${formatPrice(totalPrice)}`
            )}
          </button>

          <p style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--medium-gray)',
            marginTop: 'var(--sp-12)',
            textAlign: 'center',
          }}>
            Thanh toán bằng <strong>tiền mặt</strong> khi nhận hàng.
          </p>
        </form>

        {/* Order Summary */}
        <div style={{
          background: 'var(--off-white)',
          borderRadius: 'var(--br-md)',
          padding: 'var(--sp-20)',
        }}>
          <h3 style={{
            fontSize: 'var(--fs-body-lg)',
            fontWeight: 400,
            marginBottom: 'var(--sp-16)',
          }}>
            Đơn hàng của bạn
          </h3>
          <div className="flex-col gap-12">
            {items.map(item => (
              <div key={item.id} className="flex-between" style={{ fontSize: 'var(--fs-body)' }}>
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span style={{ fontWeight: 600 }}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            borderTop: '1px solid var(--pale-gray)',
            marginTop: 'var(--sp-16)',
            paddingTop: 'var(--sp-16)',
          }}>
            <div className="flex-between" style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 700 }}>
              <span>Tổng cộng</span>
              <span style={{ color: 'var(--brand-red)' }}>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 639px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
