class Cart {
  static calculateTotals(items = [], deliveryFee = 30, discount = 0) {
    const subtotal = items.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)), 0);
    const finalFee = subtotal >= 199 || subtotal === 0 ? 0 : deliveryFee;
    const total = Math.max(0, subtotal - discount + finalFee);
    return { subtotal, deliveryFee: finalFee, discount, total };
  }
}
module.exports = Cart;
