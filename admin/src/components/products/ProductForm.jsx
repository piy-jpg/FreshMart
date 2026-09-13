import React, { useState } from 'react';

export const ProductForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState(product || {
    name: '',
    category: 'leafy',
    price: '',
    unit: '1 kg',
    stock: 100,
    organic: true,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Product Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
          style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Price (₹)</label>
          <input
            type="number"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
            required
            style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Unit / Weight</label>
          <input
            type="text"
            value={formData.unit}
            onChange={e => setFormData({ ...formData, unit: e.target.value })}
            placeholder="e.g. 500g, 1 kg"
            required
            style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
        >
          Save Product
        </button>
      </div>
    </form>
  );
};
