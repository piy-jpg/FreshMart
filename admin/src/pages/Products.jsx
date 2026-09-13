import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { ProductForm } from '../components/products/ProductForm';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const loadProducts = () => {
    adminApi.getProducts().then(res => {
      if (res && res.data) setProducts(res.data);
    }).catch(() => {});
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSave = async (data) => {
    if (editProduct) {
      await adminApi.updateProduct(editProduct.id, data);
    } else {
      await adminApi.createProduct(data);
    }
    setShowModal(false);
    setEditProduct(null);
    loadProducts();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Fresh Produce Catalog ({products.length} items)</h2>
        <button
          onClick={() => { setEditProduct(null); setShowModal(true); }}
          style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Add New Product
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {products.map(p => (
          <div key={p.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img src={p.image} alt={p.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', background: '#0f172a' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.unit} • ₹{p.price}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: p.stock > 0 ? '#34d399' : '#f87171' }}>
                {p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { setEditProduct(p); setShowModal(true); }}
                  style={{ padding: '4px 10px', background: '#334155', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '24px', width: '480px' }}>
            <h3 style={{ marginBottom: '16px' }}>{editProduct ? 'Edit Product' : 'Add New Fresh Product'}</h3>
            <ProductForm product={editProduct} onSave={handleSave} onCancel={() => { setShowModal(false); setEditProduct(null); }} />
          </div>
        </div>
      )}
    </div>
  );
};
