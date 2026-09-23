module.exports = {
  validateOrder: (body) => (!body.items || !body.items.length) ? 'Order must contain items' : null
};
