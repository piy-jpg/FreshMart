class PaymentService {
  static processPayment(orderId, amount, method) {
    return { transactionId: 'TXN_' + Date.now(), status: 'SUCCESS', amount, method };
  }
}
module.exports = PaymentService;
