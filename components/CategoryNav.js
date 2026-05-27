export default function CategoryNav({ categories, activeId, onSelect }) {
  return (
    <div style={{
      display: 'flex',
      gap: 'var(--sp-8)',
      overflowX: 'auto',
      padding: 'var(--sp-12) 0',
      marginBottom: 'var(--sp-24)',
      WebkitOverflowScrolling: 'touch',
    }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          ...categoryBtnStyle,
          background: activeId === null ? 'var(--brand-red)' : 'var(--white)',
          color: activeId === null ? 'var(--white)' : 'var(--charcoal-black)',
          border: activeId === null ? 'none' : '1px solid var(--pale-gray)',
        }}
      >
        Tất cả
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={{
            ...categoryBtnStyle,
            background: activeId === cat.id ? 'var(--brand-red)' : 'var(--white)',
            color: activeId === cat.id ? 'var(--white)' : 'var(--charcoal-black)',
            border: activeId === cat.id ? 'none' : '1px solid var(--pale-gray)',
          }}
        >
          {cat.image && (
            <img
              src={cat.image}
              alt={cat.name}
              style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
          {cat.name}
        </button>
      ))}
      <style jsx>{`
        ::-webkit-scrollbar { height: 0; }
      `}</style>
    </div>
  );
}

const categoryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: 'var(--br-lg)',
  fontSize: 'var(--fs-body)',
  fontWeight: 400,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
  fontFamily: 'var(--font-primary)',
  minHeight: '36px',
};
