import React from 'react';
import { ZoneMap } from '../components/delivery/ZoneMap';

export const DeliveryZones = () => {
  const zones = [
    { name: 'Jaipur Central (Hub Area)', radiusKm: 5, deliveryFee: 0, minOrder: 199, status: 'Active' },
    { name: 'Malviya Nagar & Mansarovar', radiusKm: 12, deliveryFee: 25, minOrder: 299, status: 'Active' },
    { name: 'Vaishali Nagar & Vidhyadhar', radiusKm: 15, deliveryFee: 30, minOrder: 349, status: 'Active' },
    { name: 'Sitapura & Jagatpura Outer', radiusKm: 22, deliveryFee: 45, minOrder: 499, status: 'Active' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <ZoneMap zones={zones} />

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Configured Geofences & Pricing</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Zone Name</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Radius</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Delivery Fee</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Min Order</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #283548' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>{z.name}</td>
                <td style={{ padding: '14px 16px' }}>{z.radiusKm} km</td>
                <td style={{ padding: '14px 16px', color: z.deliveryFee === 0 ? '#34d399' : '#fff' }}>
                  {z.deliveryFee === 0 ? 'FREE' : `₹${z.deliveryFee}`}
                </td>
                <td style={{ padding: '14px 16px' }}>₹{z.minOrder}</td>
                <td style={{ padding: '14px 16px' }}><span className="badge badge-success">{z.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
