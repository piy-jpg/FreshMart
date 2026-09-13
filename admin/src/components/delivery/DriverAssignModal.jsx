import React, { useState } from 'react';

export const DriverAssignModal = ({ order, drivers = [], onAssign, onClose }) => {
  const [selectedDriver, setSelectedDriver] = useState('');

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '24px', width: '400px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Assign Driver for Order #{order?.id}</h3>
        <select
          value={selectedDriver}
          onChange={e => setSelectedDriver(e.target.value)}
          style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', marginBottom: '16px' }}
        >
          <option value="">Select a Delivery Executive</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.status || 'Available'})</option>
          ))}
        </select>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onAssign(selectedDriver)} disabled={!selectedDriver} style={{ padding: '8px 16px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Assign & Dispatch</button>
        </div>
      </div>
    </div>
  );
};
