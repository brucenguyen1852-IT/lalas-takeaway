import Link from 'next/link';
import { useCart } from './CartContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const { totalItems, toggleCart } = useCart();
  const [settings, setSettings] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <header style={{
      background: 'var(--white)',
      borderBottom: '1px solid var(--pale-gray)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontSize: 'var(--fs-h3)',
          fontWeight: 700,
          color: 'var(--brand-red)',
          textDecoration: 'none',
        }}>
          {settings.logo ? (
            <img src={settings.logo} alt={settings.site_name || "LaLa's Take Away"} style={{ height: '40px', width: 'auto' }} />
          ) : (
            settings.site_name || "LaLa's Take Away"
          )}
        </Link>

        {/* Nav - Desktop */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)' }} className="nav-desktop">
          <Link href="/" style={navLinkStyle}>Trang chủ</Link>
          <Link href="/menu" style={navLinkStyle}>Thực đơn</Link>
          <Link href="/tracking" style={navLinkStyle}>Theo dõi đơn</Link>

          {/* Cart button */}
          <button onClick={toggleCart} style={cartBtnStyle} aria-label="Giỏ hàng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && (
              <span style={cartBadgeStyle}>{totalItems}</span>
            )}
          </button>
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ ...cartBtnStyle, display: 'none' }}
          className="nav-mobile-toggle"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{
          display: 'none',
          flexDirection: 'column',
          padding: 'var(--sp-16)',
          borderTop: '1px solid var(--pale-gray)',
          background: 'var(--white)',
        }}>
          <Link href="/" style={mobileNavStyle} onClick={() => setMenuOpen(false)}>Trang chủ</Link>
          <Link href="/menu" style={mobileNavStyle} onClick={() => setMenuOpen(false)}>Thực đơn</Link>
          <Link href="/tracking" style={mobileNavStyle} onClick={() => setMenuOpen(false)}>Theo dõi đơn</Link>
          <button onClick={() => { toggleCart(); setMenuOpen(false); }} style={{ ...mobileNavStyle, textAlign: 'left', width: '100%', background: 'none', border: 'none', fontFamily: 'var(--font-primary)', fontSize: 'var(--fs-body-lg)' }}>
            Giỏ hàng {totalItems > 0 && `(${totalItems})`}
          </button>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 639px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
          .nav-mobile-menu { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

const navLinkStyle = {
  padding: '12px 16px',
  color: 'var(--charcoal-black)',
  fontSize: 'var(--fs-body-lg)',
  textDecoration: 'none',
  borderRadius: 'var(--br-none)',
  transition: 'color 0.2s',
};

const cartBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--charcoal-black)',
  padding: '8px',
  cursor: 'pointer',
  position: 'relative',
  minWidth: '44px',
  minHeight: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cartBadgeStyle = {
  position: 'absolute',
  top: '2px',
  right: '2px',
  background: 'var(--brand-red)',
  color: 'var(--white)',
  fontSize: '11px',
  fontWeight: 700,
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const mobileNavStyle = {
  padding: '12px 16px',
  color: 'var(--charcoal-black)',
  fontSize: 'var(--fs-body-lg)',
  textDecoration: 'none',
  display: 'block',
};
