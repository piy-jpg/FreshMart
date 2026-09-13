import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { OrderRow } from '../components/orders/OrderRow';

export const LiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchOrders = () => {
    adminApi.getOrders().then(res => {
      if (res && res.data) setOrders(res.data);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await adminApi.updateOrderStatus(orderId, newStatus);
    fetchOrders();
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid #334155',
                background: filter === st ? '#10b981' : '#1e293b',
                color: filter === st ? '#fff' : '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={fetchOrders} style={{ padding: '6px 14px', background: '#334155', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Order</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Customer</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Items</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Total</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Current Status</th>
              <th style={{ padding: '12px 16px', color: '#94a3b8' }}>Update Stage</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No live orders found in this filter.</td></tr>
            ) : (
              filteredOrders.map(order => (
                <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
