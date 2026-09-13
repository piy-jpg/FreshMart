import { request } from './api';
export const locationService = {
  getAddresses: () => request('/addresses'),
  saveAddress: (addr) => request('/addresses', { method: 'POST', body: JSON.stringify(addr) }),
  checkZone: (pincode) => request(`/delivery/check?pincode=${pincode}`)
};
