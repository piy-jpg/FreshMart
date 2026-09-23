const crypto = require('crypto');

class RazorpayGateway {
  verifyPaymentSignature(orderId, paymentId, signature, secret) {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto.createHmac('sha256', secret || 'freshmart_razorpay_secret').update(text).digest('hex');
    return generated === signature;
  }
}

module.exports = new RazorpayGateway();
