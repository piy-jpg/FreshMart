import React, { useState } from 'react';

export const Categories = () => {
  const [categories] = useState([
    { id: 'leafy', name: 'Leafy Greens & Herbs', count: 8, icon: '🥬' },
    { id: 'daily', name: 'Daily Essentials', count: 12, icon: '🥔' },
    { id: 'root', name: 'Root Vegetables', count: 6, icon: '🥕' },
    { id: 'exotic', name: 'Exotic & Organic', count: 5, icon: '🥑' },
    { id: 'fruits', name: 'Seasonal Farm Fruits', count: 9, icon: '🍎' }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Produce Categories Management</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '32px' }}>{cat.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px', color: '#f8fafc' }}>{cat.name}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{cat.count} Active Products</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
