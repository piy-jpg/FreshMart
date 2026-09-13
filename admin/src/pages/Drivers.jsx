import React from 'react';

export const Drivers = () => {
  const drivers = [
    { id: 'DRV-101', name: 'Ramesh Sharma', phone: '+91 98290 11223', vehicle: 'EV Bike (RJ14-EA-2023)', activeOrders: 1, status: 'On Delivery' },
    { id: 'DRV-102', name: 'Vikram Singh', phone: '+91 98290 44556', vehicle: 'EV Scooter (RJ14-EA-4120)', activeOrders: 0, status: 'Available' },
    { id: 'DRV-103', name: 'Sanjay Kumar', phone: '+91 98290 77889', vehicle: 'EV Scooter (RJ14-EA-9011)', activeOrders: 2, status: 'On Delivery' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Delivery Fleet & Drivers</h2>
        <button style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
          + Register Driver
        </button>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Driver ID</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Name</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Vehicle</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Active Dispatches</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #283548' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#38bdf8' }}>{d.id}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div>{d.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{d.phone}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>{d.vehicle}</td>
                <td style={{ padding: '14px 16px' }}>{d.activeOrders}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${d.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
