class Product {
  static isAvailable(prod) {
    return prod && prod.stock > 0 && prod.status !== 'SUSPENDED' && prod.status !== 'OUT_OF_STOCK';
  }
}
module.exports = Product;
