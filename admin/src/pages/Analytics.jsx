import React from 'react';
import { StatCard } from '../components/common/StatCard';

export const Analytics = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Performance & Sales Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="Monthly Gross Merchandise" value="₹4,82,500" change="+18.4% vs last month" icon="📈" color="#34d399" />
        <StatCard title="Average Order Value" value="₹385" change="+5.2%" icon="🏷️" color="#38bdf8" />
        <StatCard title="Avg Delivery Speed" value="28 mins" change="Goal: < 35 mins" icon="⚡" color="#fbbf24" />
        <StatCard title="Repeat Customer Rate" value="76%" change="+8% retention" icon="🔁" color="#a78bfa" />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Top Selling Fresh Vegetables (This Week)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { name: 'Organic Fresh Spinach (Palak)', sold: '420 kg', revenue: '₹16,800', share: '85%' },
            { name: 'Farm Fresh Tomatoes', sold: '580 kg', revenue: '₹14,500', share: '78%' },
            { name: 'Mountain Potatoes', sold: '720 kg', revenue: '₹21,600', share: '92%' },
            { name: 'Fresh Green Coriander', sold: '190 bunches', revenue: '₹3,800', share: '60%' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', borderRadius: '6px' }}>
              <span style={{ fontWeight: 600 }}>{item.name}</span>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#94a3b8' }}>
                <span>Sold: {item.sold}</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{item.revenue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
