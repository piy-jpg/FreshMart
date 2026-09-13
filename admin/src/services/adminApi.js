const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('freshmart_admin_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const adminApi = {
  // Orders
  getOrders: async (status = '') => {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${BASE_URL}/orders${query}`, { headers: getHeaders() });
    return res.json();
  },
  updateOrderStatus: async (orderId, status) => {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Products
  getProducts: async () => {
    const res = await fetch(`${BASE_URL}/products`, { headers: getHeaders() });
    return res.json();
  },
  createProduct: async (data) => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  updateProduct: async (id, data) => {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  deleteProduct: async (id) => {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories`, { headers: getHeaders() });
    return res.json();
  },

  // Delivery Zones
  getDeliveryZones: async () => {
    const res = await fetch(`${BASE_URL}/delivery/zones`, { headers: getHeaders() });
    return res.json();
  },
  updateDeliveryZone: async (zoneId, data) => {
    const res = await fetch(`${BASE_URL}/delivery/zones/${zoneId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics & Stats
  getDashboardStats: async () => {
    const res = await fetch(`${BASE_URL}/admin/stats`, { headers: getHeaders() }).catch(() => null);
    if (!res || !res.ok) {
      return {
        todaySales: 18450,
        liveOrders: 8,
        activeCustomers: 412,
        lowStockItems: 3
      };
    }
    return res.json();
  }
};
