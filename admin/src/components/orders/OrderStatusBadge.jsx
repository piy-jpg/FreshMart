import React from 'react';

export const OrderStatusBadge = ({ status }) => {
  const configs = {
    'Placed': { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', label: 'Order Placed' },
    'Confirmed': { bg: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', label: 'Confirmed' },
    'Packing': { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', label: 'Packing' },
    'Out for Delivery': { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', label: 'Out for Delivery' },
    'Delivered': { bg: 'rgba(52, 211, 153, 0.15)', color: '#34d399', label: 'Delivered' },
    'Cancelled': { bg: 'rgba(248, 113, 113, 0.15)', color: '#f87171', label: 'Cancelled' }
  };

  const current = configs[status] || { bg: '#334155', color: '#94a3b8', label: status };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: current.bg,
      color: current.color
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: current.color }} />
      {current.label}
    </span>
  );
};
