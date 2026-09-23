import { request } from './api';
export const cartService = {
  getCart: () => request('/cart'),
  syncCart: (cart) => request('/cart/sync', { method: 'POST', body: JSON.stringify(cart) })
};
