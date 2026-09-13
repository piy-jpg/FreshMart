import React from 'react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'live-orders', label: 'Live Orders', icon: '⚡' },
    { id: 'products', label: 'Products Catalog', icon: '🥦' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'delivery-zones', label: 'Delivery Zones', icon: '🗺️' },
    { id: 'drivers', label: 'Fleet & Drivers', icon: '🛵' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'analytics', label: 'Analytics & Sales', icon: '📈' },
    { id: 'settings', label: 'Platform Settings', icon: '⚙️' }
  ];

  return (
    <aside className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🥬</span>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', letterSpacing: '-0.5px' }}>FreshMart</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin & Owner Console</span>
        </div>
      </div>
      <nav style={{ padding: '16px 8px', flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} style={{ marginBottom: '4px' }}>
                <button
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? '#10b981' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          FM
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Super Admin</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>care@freshmart.in</div>
        </div>
      </div>
    </aside>
  );
};
