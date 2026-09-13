import React from 'react';

export const Settings = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Platform Settings & Owner Controls</h2>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#10b981' }}>🏪 Store Operations</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Live Store Acceptance</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Toggle online order taking for FreshMart storefront</div>
          </div>
          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Express 30-Min Delivery Slot</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Enable priority hyper-local dispatch</div>
          </div>
          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
        </div>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#38bdf8' }}>📞 Support & Branding</h3>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Platform Brand Name</label>
          <input type="text" defaultValue="FreshMart" style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Customer Support Helpline</label>
          <input type="text" defaultValue="1800-FRESH-MART" style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Support Email</label>
          <input type="email" defaultValue="care@freshmart.in" style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
        </div>
        <button style={{ alignSelf: 'flex-start', padding: '8px 18px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}>
          Save Configuration
        </button>
      </div>
    </div>
  );
};
