import React from 'react';

export const Customers = () => {
  const customers = [
    { id: 'CUST-001', name: 'Amit Verma', phone: '+91 94140 12345', email: 'amit@example.com', orders: 14, spent: '₹4,820', joined: 'Jan 2026' },
    { id: 'CUST-002', name: 'Pooja Agarwal', phone: '+91 94140 67890', email: 'pooja@example.com', orders: 8, spent: '₹2,640', joined: 'Feb 2026' },
    { id: 'CUST-003', name: 'Rajesh Meena', phone: '+91 94140 55443', email: 'rajesh@example.com', orders: 19, spent: '₹7,110', joined: 'Jan 2026' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Customer Directory</h2>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>ID</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Customer</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Total Orders</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Total Spent</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Member Since</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #283548' }}>
                <td style={{ padding: '14px 16px', color: '#38bdf8' }}>{c.id}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.phone} • {c.email}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>{c.orders} orders</td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#34d399' }}>{c.spent}</td>
                <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{c.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
