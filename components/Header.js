import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from './CartContext';

export default function Header() {
  const router = useRouter();
  const { totalItems } = useCart();
  const path = router.pathname;

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/menu', icon: '🍽️', label: 'Menu' },
    { path: '/cart', icon: '🛒', label: 'Cart', badge: totalItems },
    { path: '/tracking', icon: '📦', label: 'Orders' },
  ];

  return (
    <>
      {/* Top header bar */}
      <header className="top-header">
        <Link href="/" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.3px',
        }}>
          LaLa's
        </Link>
        <div style={{ flex: 1 }} />
      </header>

      {/* Bottom Navigation (mobile) */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={`bottom-nav-item${path === item.path ? ' active' : ''}`}
            style={{ textDecoration: 'none', position: 'relative' }}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className="bottom-nav-badge">{item.badge}</span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
