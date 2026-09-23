const { db } = require('../../database/connection');
const { userRepository, orderRepository } = require('../repositories');

class OwnerService {
  getStoreMetrics() {
    const orders = orderRepository.getAll();
    const users = userRepository.getAll();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? (o.totalAmount || 0) : 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    const completedOrders = orders.filter(o => o.status === 'DELIVERED');
    const customersCount = users.filter(u => u.role === 'CUSTOMER').length;

    return {
      totalRevenue,
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: completedOrders.length,
      totalOrdersCount: orders.length,
      customersCount
    };
  }

  getStaffMembers() {
    return (userRepository.getAll() || []).filter(u => {
      const r = (u.role || '').toUpperCase();
      return r === 'SUB_ADMIN' || r === 'STAFF' || r === 'DELIVERY_BOY';
    });
  }
}

module.exports = new OwnerService();
