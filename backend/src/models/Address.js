class Address {
  static format(addr) {
    if (!addr) return '';
    return `${addr.flat || ''}, ${addr.street || ''}, ${addr.city || ''} ${addr.pincode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '');
  }
}
module.exports = Address;
