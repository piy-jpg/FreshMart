class Order {
  static STATUSES = [
    'CONFIRMED', 'ACCEPTED_BY_HUB', 'PICKING', 'QUALITY_CHECK', 
    'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED', 
    'DELIVERED', 'CANCELLED'
  ];
}
module.exports = Order;
