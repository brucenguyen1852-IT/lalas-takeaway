import Header from './Header';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: '70vh' }}>{children}</main>
      <footer style={{ textAlign: 'center', padding: 'var(--sp-2xl) var(--sp-lg)', borderTop: '1px solid var(--border-light)', marginTop: 'var(--sp-3xl)' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 4 }}>LaLa's Take Away</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Authentic Vietnamese Cuisine — Made with Love</p>
      </footer>
    </>
  );
}
