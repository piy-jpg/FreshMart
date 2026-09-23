import React, { useState, useEffect } from 'react';
import { StatCard } from '../components/common/StatCard';
import { DataTable } from '../components/common/DataTable';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { adminApi } from '../services/adminApi';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: '₹18,450',
    liveOrders: '12',
    activeCustomers: '418',
    lowStockItems: '3'
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    adminApi.getOrders().then(res => {
      if (res && res.data) {
        setRecentOrders(res.data.slice(0, 5));
      }
    }).catch(() => {});
  }, []);

  const columns = [
    { header: 'Order ID', accessor: 'id', render: (row) => <span style={{ fontWeight: 600, color: '#38bdf8' }}>#{row.id}</span> },
    { header: 'Customer', accessor: 'customerName', render: (row) => row.customerName || 'Customer' },
    { header: 'Items', accessor: 'items', render: (row) => `${row.items?.length || 1} items` },
    { header: 'Total', accessor: 'total', render: (row) => `₹${row.total || row.totalAmount}` },
    { header: 'Status', accessor: 'status', render: (row) => <OrderStatusBadge status={row.status} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard title="Today's Revenue" value={stats.todaySales} change="+14.2% from yesterday" icon="💰" color="#34d399" />
        <StatCard title="Active Live Orders" value={stats.liveOrders} change="4 waiting dispatch" icon="⚡" color="#38bdf8" />
        <StatCard title="Total Customers" value={stats.activeCustomers} change="+28 new this week" icon="👥" color="#a78bfa" />
        <StatCard title="Low Stock Alerts" value={stats.lowStockItems} change="Restock needed" icon="⚠️" color="#f87171" />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Live Orders Stream</h2>
          <span style={{ fontSize: '12px', color: '#10b981' }}>● Auto-refreshing</span>
        </div>
        <DataTable columns={columns} data={recentOrders} />
      </div>
    </div>
  );
};
