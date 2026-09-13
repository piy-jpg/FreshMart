module.exports = {
  validateProduct: (body) => (!body.name || body.price === undefined) ? 'Product name and price are required' : null
};
