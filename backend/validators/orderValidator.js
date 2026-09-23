function validateOrderCreation(body) {
  const items = Array.isArray(body.items) ? body.items : Object.values(body.items || {});
  if (!items || items.length === 0) {
    return { valid: false, error: 'Cannot place order with an empty basket.' };
  }

  const deliveryAddress = body.deliveryAddress || body.address;
  if (!deliveryAddress) {
    return { valid: false, error: 'Delivery address is required.' };
  }

  return { valid: true, data: { items, deliveryAddress, paymentMethod: body.paymentMethod || 'COD', deliverySlot: body.deliverySlot || 'Standard' } };
}

module.exports = {
  validateOrderCreation
};
