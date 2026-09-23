function getOrderConfirmationEmailTemplate(order) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e7e5e4;border-radius:16px;">
      <h2 style="color:#047857;">Order Confirmed! 🧺</h2>
      <p>Thank you for ordering with FreshMart, <strong>${order.customerName}</strong>!</p>
      <p><strong>Order ID:</strong> #${order.id}</p>
      <p><strong>Delivery OTP:</strong> <span style="font-size:20px;font-weight:bold;color:#047857;">${order.otp}</span></p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
      <p>Share this 4-digit OTP with your delivery partner upon arrival.</p>
    </div>
  `;
}

module.exports = {
  getOrderConfirmationEmailTemplate
};
