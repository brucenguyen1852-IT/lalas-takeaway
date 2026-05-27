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
      <header className="header">
        <Link href="/" className="header-logo" style={{ textDecoration: 'none' }}>LaLa's</Link>
        <nav className="header-nav">
          <Link href="/" className="header-link">Home</Link>
          <Link href="/menu" className="header-link">Menu</Link>
          <Link href="/cart" className="header-link" style={{ position: 'relative' }}>
            Cart{totalItems > 0 && <span style={{ position: 'absolute', top: -2, right: -8, background: 'var(--accent)', color: 'white', width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>}
          </Link>
          <Link href="/tracking" className="header-link">Orders</Link>
        </nav>
      </header>

      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link key={item.path} href={item.path} className={`nav-item${path === item.path ? ' active' : ''}`} style={{ textDecoration: 'none', position: 'relative' }}>
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </Link>
        ))}
      </nav>
    </>
  );
}
