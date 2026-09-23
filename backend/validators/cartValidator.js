function validateCartItems(items) {
  if (!items || typeof items !== 'object') {
    return { valid: true, data: {} };
  }
  return { valid: true, data: items };
}

module.exports = {
  validateCartItems
};
