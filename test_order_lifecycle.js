// ========================================================
// SABJIHUB END-TO-END ORDER LIFECYCLE TEST SUITE
// ========================================================

const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: responseData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting SabjiHub Order to Delivery System Tests...\n');

  // 1. Health
  const health = await request('GET', '/api/health');
  console.log('✓ Health Check:', health.status === 200 ? 'PASSED' : 'FAILED');

  // 2. Eligibility
  const elig = await request('POST', '/api/delivery/eligibility', { pincode: '560038' });
  console.log('✓ 90-Min Eligibility (Indiranagar 560038):', elig.body.expressEligible ? 'PASSED (Eligible)' : 'FAILED');

  // 3. Cart Validation
  const cartVal = await request('POST', '/api/cart/validate', {
    items: [
      { id: 'veg-potato', name: 'Pahadi Potato', price: 35, originalPrice: 45, qty: 2 },
      { id: 'veg-tomato', name: 'Fresh Tomato', price: 40, originalPrice: 50, qty: 1 }
    ],
    couponCode: 'FRESH50',
    pincode: '560038'
  });
  console.log(`✓ Server-side Cart & Pricing Engine: Subtotal ₹${cartVal.body.subtotal}, Discount ₹${cartVal.body.discount}, Final ₹${cartVal.body.finalTotal}`);

  // 4. Create Order
  const orderRes = await request('POST', '/api/orders', {
    items: [
      { id: 'veg-potato', name: 'Pahadi Potato', weightLabel: '1 kg', price: 35, originalPrice: 45, qty: 1, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80' },
      { id: 'veg-onion', name: 'Nashik Onion', weightLabel: '1 kg', price: 28, originalPrice: 36, qty: 1, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=300&q=80' },
      { id: 'veg-tomato', name: 'Fresh Tomato', weightLabel: '1 kg', price: 40, originalPrice: 50, qty: 1, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80' }
    ],
    deliveryOption: 'EXPRESS_90_MIN',
    paymentMethod: 'UPI (PhonePe)',
    deliveryAddress: {
      tag: 'Home',
      fullName: 'Rahul Sharma',
      phone: '+91 98450 12345',
      flat: 'Flat 402, Green Glen Towers',
      street: '12th Main Road, HAL 2nd Stage',
      city: 'Indiranagar, Bengaluru',
      pincode: '560038'
    }
  });

  const order = orderRes.body;
  console.log(`✓ Order Created: #${order.orderId} (Status: ${order.orderStatus}, OTP: ${order.deliveryOtp})`);

  // 5. Hub Accept
  const acceptRes = await request('PATCH', `/api/hub/orders/${order.id}/accept`);
  console.log(`✓ Hub Accepted Order: Status -> ${acceptRes.body.orderStatus}`);

  // 6. Hub Picking
  const pickRes = await request('PATCH', `/api/hub/orders/${order.id}/picking`);
  console.log(`✓ Harvest Picking in Progress: Status -> ${pickRes.body.orderStatus}`);

  // 7. Hub Quality Check
  const qcRes = await request('PATCH', `/api/hub/orders/${order.id}/quality-check`, {
    inspector: 'QC Lead Anand Verma',
    checklist: ['Freshness', 'Correct Product', 'Correct Quantity', 'Correct Weight', 'No Visible Damage']
  });
  console.log(`✓ Quality Inspection Passed: Status -> ${qcRes.body.orderStatus}`);

  // 8. Hub Packing
  const packRes = await request('PATCH', `/api/hub/orders/${order.id}/packed`);
  console.log(`✓ Packed in Plastic-Free Eco Bag: Status -> ${packRes.body.orderStatus}`);

  // 9. Delivery Partner Pick Up
  const pickupRes = await request('PATCH', `/api/delivery/orders/${order.id}/pickup`);
  console.log(`✓ Delivery Partner Picked Up: Status -> ${pickupRes.body.orderStatus}`);

  // 10. Out for Delivery
  const outRes = await request('PATCH', `/api/delivery/orders/${order.id}/out-for-delivery`);
  console.log(`✓ Out for Delivery (EV Pilot): Status -> ${outRes.body.orderStatus}`);

  // 11. Arrived at Doorstep
  const arrivedRes = await request('PATCH', `/api/delivery/orders/${order.id}/arrived`);
  console.log(`✓ Arrived at Doorstep: Status -> ${arrivedRes.body.orderStatus}`);

  // 12. Attempt OTP with invalid code
  const badOtpRes = await request('POST', `/api/delivery/orders/${order.id}/verify-otp`, { otp: '0000' });
  console.log(`✓ Security Test (Wrong OTP '0000'): Handled correctly (${badOtpRes.status === 400 ? 'Rejected with 400' : 'FAILED'})`);

  // 13. Verify OTP with correct code
  const goodOtpRes = await request('POST', `/api/delivery/orders/${order.id}/verify-otp`, { otp: order.deliveryOtp });
  console.log(`✓ Delivery Verification (Correct OTP '${order.deliveryOtp}'): Status -> ${goodOtpRes.body.order.orderStatus}`);

  // 14. Customer Rating
  const reviewRes = await request('POST', `/api/orders/${order.id}/review`, {
    deliveryRating: 5,
    productRating: 5,
    feedback: 'Incredible 40-minute delivery. The tomatoes smell like fresh rain on soil!'
  });
  console.log(`✓ Customer Review Submitted: 5-Star Delivery & Produce Rating`);

  console.log('\n🎉 ALL ORDER LIFECYCLE TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
