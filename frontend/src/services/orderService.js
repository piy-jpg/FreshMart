import { request } from './api';
export const orderService = {
  create: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getUserOrders: (ids = []) => request(`/user/orders${ids.length ? '?ids=' + ids.join(',') : ''}`),
  track: (id) => request(`/orders/${id}`)
};
