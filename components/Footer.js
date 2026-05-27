import { useState, useEffect } from 'react';

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <footer style={{
      background: 'var(--very-dark-gray)',
      color: 'var(--lighter-gray)',
      padding: 'var(--sp-56) 0 var(--sp-32)',
      marginTop: 'var(--sp-56)',
    }}>
      <div className="container">
        <div className="grid-2" style={{ marginBottom: 'var(--sp-40)' }}>
          <div>
            <h3 style={{
              fontSize: 'var(--fs-h3)',
              color: 'var(--white)',
              fontWeight: 400,
              marginBottom: 'var(--sp-16)',
            }}>
              {settings.site_name || "LaLa's Take Away"}
            </h3>
            <p style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }}>
              {settings.site_description || 'Ẩm thực Việt Nam truyền thống'}
            </p>
          </div>
          <div>
            <h4 style={{
              fontSize: 'var(--fs-body-lg)',
              color: 'var(--white)',
              fontWeight: 400,
              marginBottom: 'var(--sp-12)',
            }}>
              Thông tin liên hệ
            </h4>
            <div style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
              {settings.address && (
                <p>📍 {settings.address}</p>
              )}
              {settings.phone && (
                <p>📞 {settings.phone}</p>
              )}
              {settings.email && (
                <p>✉️ {settings.email}</p>
              )}
              {settings.hours && (
                <p>🕐 {settings.hours}</p>
              )}
            </div>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 'var(--sp-20)',
          textAlign: 'center',
          fontSize: 'var(--fs-caption)',
          color: 'var(--medium-gray)',
        }}>
          © {new Date().getFullYear()} {settings.site_name || "LaLa's Take Away"}. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
