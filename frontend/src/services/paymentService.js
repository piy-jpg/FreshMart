import { request } from './api';
export const paymentService = {
  processPayment: (payload) => request('/payment/charge', { method: 'POST', body: JSON.stringify(payload) })
};
