import React from 'react';

export const ZoneMap = ({ zones = [] }) => {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
      <h3 style={{ fontSize: '16px', color: '#f8fafc', marginBottom: '6px' }}>Delivery Geofence & Active Zones</h3>
      <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 16px' }}>
        FreshMart operational hub geofence coverage active across Jaipur & surrounding metropolitan pin codes.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {zones.map((z, idx) => (
          <div key={idx} style={{ background: '#0f172a', padding: '10px 16px', borderRadius: '6px', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#38bdf8' }}>{z.name || `Zone ${idx + 1}`}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Radius: {z.radiusKm || 10} km • Fee: ₹{z.deliveryFee || 25}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
