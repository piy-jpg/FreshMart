import React from 'react';

export const StatCard = ({ title, value, change, icon, color = '#10b981' }) => {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '10px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>{value}</div>
      {change && (
        <div style={{ fontSize: '12px', color: color, fontWeight: 600 }}>
          {change}
        </div>
      )}
    </div>
  );
};
