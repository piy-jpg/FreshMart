import React from 'react';
import { OrderStatusBadge } from './OrderStatusBadge';

export const OrderRow = ({ order, onStatusChange }) => {
  const statuses = ['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  return (
    <tr style={{ borderBottom: '1px solid #283548' }}>
      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#38bdf8' }}>#{order.id}</td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 600 }}>{order.customerName || 'Customer'}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{order.phone || '9876543210'}</div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: '13px' }}>{order.items?.length || 1} items</div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{order.items?.map(i => i.name).join(', ') || 'Vegetables'}</div>
      </td>
      <td style={{ padding: '14px 16px', fontWeight: 700 }}>₹{order.total || order.totalAmount}</td>
      <td style={{ padding: '14px 16px' }}>
        <OrderStatusBadge status={order.status} />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            color: '#f8fafc',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
    </tr>
  );
};
