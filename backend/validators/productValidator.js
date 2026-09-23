function validateProduct(body) {
  const name = (body.name || '').trim();
  const price = Number(body.price);
  if (!name) return { valid: false, error: 'Product name is required.' };
  if (isNaN(price) || price < 0) return { valid: false, error: 'Valid product price is required.' };
  return { valid: true, data: body };
}

module.exports = {
  validateProduct
};
