module.exports = {
  validateAddress: (body) => (!body.flat || !body.street || !body.pincode) ? 'Flat, street and pincode are required' : null
};
