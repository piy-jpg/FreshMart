export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPhone = (phone) => /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone);
export const isValidPincode = (pincode) => /^\d{6}$/.test(pincode);
