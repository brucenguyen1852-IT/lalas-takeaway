import Header from './Header';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main className="page-enter" style={{ minHeight: '70vh' }}>
        {children}
      </main>
      <div style={{ padding: 'var(--sp-2xl) var(--sp-base)', textAlign: 'center', borderTop: '1px solid var(--color-border-light)', marginTop: 'var(--sp-2xl)' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-md)', color: 'var(--color-text)', fontWeight: 600, marginBottom: 'var(--sp-xs)' }}>
          LaLa's Take Away
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Authentic Vietnamese Cuisine
        </p>
      </div>
    </>
  );
}
