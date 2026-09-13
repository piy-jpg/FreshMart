import { request } from './api';
export const deliveryService = {
  checkEligibility: (pincode) => request(`/delivery/eligibility?pincode=${pincode}`)
};
