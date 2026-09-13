import React from 'react';

export const CategorySelector = ({ categories = [], selected, onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
      <button
        onClick={() => onSelect('all')}
        style={{
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          border: '1px solid #334155',
          background: selected === 'all' ? '#10b981' : '#1e293b',
          color: selected === 'all' ? '#fff' : '#94a3b8',
          cursor: 'pointer'
        }}
      >
        All Categories
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            border: '1px solid #334155',
            background: selected === cat.id ? '#10b981' : '#1e293b',
            color: selected === cat.id ? '#fff' : '#94a3b8',
            cursor: 'pointer'
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};
