import React from 'react';

export const Topbar = ({ title, activeTab }) => {
  return (
    <header className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>{title || 'Dashboard'}</h1>
        <span className="badge badge-success">System Online</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search orders, products..."
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              padding: '6px 12px 6px 32px',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              width: '240px'
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '13px', color: '#64748b' }}>🔍</span>
        </div>
        <button style={{ background: '#334155', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          🔔 <span style={{ background: '#ef4444', color: '#fff', borderRadius: '999px', padding: '1px 5px', fontSize: '10px', marginLeft: '4px' }}>3</span>
        </button>
      </div>
    </header>
  );
};
