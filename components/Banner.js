import Link from 'next/link';

export default function Banner({ banner }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '400px',
      overflow: 'hidden',
      background: 'var(--off-white)',
      borderRadius: 'var(--br-md)',
      marginBottom: 'var(--sp-16)',
    }}>
      {banner.image ? (
        <img
          src={banner.image}
          alt={banner.title || 'Banner'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, var(--warm-cream), var(--warm-peach))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 'var(--fs-h2)', color: 'var(--warm-taupe)' }}>LaLa's Take Away</span>
        </div>
      )}

      {banner.title && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 'var(--sp-24) var(--sp-32)',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
          color: 'var(--white)',
        }}>
          <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 400, marginBottom: 'var(--sp-4)' }}>
            {banner.title}
          </h2>
          {banner.link && (
            <Link href={banner.link} style={{ color: 'var(--white)', textDecoration: 'underline', fontSize: 'var(--fs-body)' }}>
              Xem thêm →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
