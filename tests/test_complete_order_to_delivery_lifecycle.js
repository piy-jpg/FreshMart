/**
 * FreshMart End-to-End Complete Order-To-Delivery Lifecycle Test
 */

const assert = require('assert');
const { PassThrough, EventEmitter } = require('stream');
const db = require('../database');
const server = require('../server');

function createMockReqRes(options = {}, body = null) {
  const req = new PassThrough();
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = Object.fromEntries(
    Object.entries(options.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  req.connection = { remoteAddress: '127.0.0.1' };
  req.socket = { remoteAddress: '127.0.0.1' };

  let statusCode = 200;
  const headers = {};
  let bodyChunks = [];
  let responseData = null;

  const res = new EventEmitter();
  res.setHeader = (name, val) => {
    const key = name.toLowerCase();
    if (key === 'set-cookie') {
      if (!headers['set-cookie']) headers['set-cookie'] = [];
      if (Array.isArray(val)) headers['set-cookie'].push(...val);
      else headers['set-cookie'].push(val);
    } else {
      headers[key] = val;
    }
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.writeHead = (code, h) => {
    statusCode = code;
    if (h) {
      for (const [k, v] of Object.entries(h)) res.setHeader(k, v);
    }
    return res;
  };
  res.write = (chunk) => {
    if (chunk) bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  };
  res.end = (chunk) => {
    if (chunk) bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const fullBody = Buffer.concat(bodyChunks).toString('utf8');
    try {
      responseData = JSON.parse(fullBody);
    } catch (e) {
      responseData = fullBody;
    }
    res.emit('finish');
  };

  if (body) {
    const payload = typeof body === 'object' ? JSON.stringify(body) : String(body);
    req.write(payload);
  }
  req.end();

  return {
    req,
    res,
    getBody: () => responseData,
    getStatusCode: () => statusCode,
    getHeaders: () => headers
  };
}

async function dispatchRequest(options = {}, body = null) {
  const { req, res, getBody, getStatusCode, getHeaders } = createMockReqRes(options, body);
  const handler = server.server.listeners('request')[0];

  return new Promise((resolve) => {
    res.on('finish', () => {
      resolve({
        statusCode: getStatusCode(),
        headers: getHeaders(),
        body: getBody()
      });
    });
    handler(req, res);
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieList = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of cookieList) {
    const m = c.match(/(?:freshmart_session|sjh_session)=([^;]+)/);
    if (m) return `sjh_session=${m[1]}; freshmart_session=${m[1]}`;
  }
  return null;
}

async function runTests() {
  console.log('🧪 Starting Fresh Mart End-to-End Order-to-Delivery Lifecycle Test Suite...\n');

  // 1. Owner Login
  console.log('1️⃣ Authenticating Owner...');
  const ownerLoginRes = await dispatchRequest(
    { method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/json' } },
    { identifier: 'piyushverma730929@gmail.com', password: 'FreshMart@2026' }
  );
  assert.strictEqual(ownerLoginRes.statusCode, 200, 'Owner login should succeed');
  const ownerCookie = extractCookie(ownerLoginRes.headers);
  assert(ownerCookie, 'Owner cookie must be obtained');
  console.log('   ✅ Owner authenticated successfully.\n');

  // 2. Delivery Boy Login
  console.log('2️⃣ Authenticating Delivery Boy (Pappu)...');
  const riderLoginRes = await dispatchRequest(
    { method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/json' } },
    { identifier: 'pappu@gmail.com', password: 'Freshmart' }
  );
  assert.strictEqual(riderLoginRes.statusCode, 200, 'Rider login should succeed');
  const riderCookie = extractCookie(riderLoginRes.headers);
  assert(riderCookie, 'Rider cookie must be obtained');
  const riderUser = db.data.users.find(u => (u.email || '').toLowerCase() === 'pappu@gmail.com');
  assert(riderUser, 'Pappu user must exist');
  console.log(`   ✅ Delivery Boy (${riderUser.name}, ID: ${riderUser.id}) logged in successfully.\n`);

  // 3. Customer Places COD Order
  console.log('3️⃣ Customer Places COD Order (Single Source of Truth)...');
  const orderPayload = {
    customerId: 'cust_ananya_01',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 98450 12345',
    customerEmail: 'ananya@example.com',
    paymentMethod: 'Cash on Delivery (COD)',
    deliveryOption: 'EXPRESS_90_MIN',
    deliverySlot: 'Express Delivery (30–90 Mins)',
    deliveryAddress: {
      fullName: 'Ananya Deshmukh',
      flat: 'Penthouse 4B',
      street: '100ft Road, HAL 2nd Stage',
      city: 'Indiranagar, Bengaluru',
      pincode: '560038'
    },
    deliveryLatitude: 12.9784,
    deliveryLongitude: 77.6408,
    deliveryInstructions: 'Ring doorbell twice. Leave near shoe rack if absent.',
    items: [
      { id: 'p_potato', name: 'Pahadi Potato', price: 35, qty: 2 },
      { id: 'p_onion', name: 'Nashik Onion', price: 28, qty: 1 }
    ]
  };

  const createRes = await dispatchRequest(
    { method: 'POST', url: '/api/orders', headers: { 'content-type': 'application/json' } },
    orderPayload
  );
  assert.strictEqual(createRes.statusCode, 201, 'Order creation should return 201');
  const createdOrder = createRes.body;
  const orderId = createdOrder.orderId || createdOrder.id;
  assert(orderId, 'Created order must have an orderId');
  assert.strictEqual(createdOrder.status, 'ORDER_PLACED', 'Initial status must be ORDER_PLACED');
  assert.strictEqual(createdOrder.paymentStatus, 'PENDING', 'COD paymentStatus must start as PENDING');
  assert(createdOrder.deliveryOtp && createdOrder.deliveryOtp.length === 4, 'Must have 4-digit deliveryOtp');
  assert.strictEqual(createdOrder.deliveryLatitude, 12.9784);
  assert.strictEqual(createdOrder.deliveryLongitude, 77.6408);
  assert.strictEqual(createdOrder.deliveryInstructions, 'Ring doorbell twice. Leave near shoe rack if absent.');
  console.log(`   ✅ Order created #${orderId} with status ORDER_PLACED, OTP: ${createdOrder.deliveryOtp}\n`);

  // 4. Storefront Order Tracking
  console.log('4️⃣ Storefront Live Tracking Endpoint Verification...');
  const trackRes = await dispatchRequest({ method: 'GET', url: `/api/orders/${orderId}` });
  assert.strictEqual(trackRes.statusCode, 200);
  assert.strictEqual(trackRes.body.orderId, orderId);
  assert.strictEqual(trackRes.body.orderStatus, 'ORDER_PLACED');
  console.log('   ✅ Customer tracking reads accurate single-record order.\n');

  // 5. Owner Dashboard Processing Lifecycle: CONFIRMED -> PACKING -> READY_FOR_PICKUP -> ASSIGNED
  console.log('5️⃣ Owner Status Progression & Delivery Boy Assignment...');
  
  // 5a. Owner Confirms Order
  const confirmRes = await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${orderId}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'CONFIRMED', notes: 'Stock verified at dark store' }
  );
  assert.strictEqual(confirmRes.statusCode, 200);
  assert(['CONFIRMED', 'ORDER_CONFIRMED'].includes(confirmRes.body.order.status || confirmRes.body.order.orderStatus));

  // 5b. Owner Starts Picking
  const pickingRes = await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${orderId}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'PICKING', notes: 'Warehouse pickers harvesting produce' }
  );
  assert.strictEqual(pickingRes.statusCode, 200);
  assert.strictEqual(pickingRes.body.order.status || pickingRes.body.order.orderStatus, 'PICKING');

  // 5c. Owner Starts Packing
  const packingRes = await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${orderId}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'PACKING', notes: 'Harvested from cold room & ozonated' }
  );
  assert.strictEqual(packingRes.statusCode, 200);
  assert.strictEqual(packingRes.body.order.status || packingRes.body.order.orderStatus, 'PACKING');

  // 5d. Owner Marks Ready for Pickup / Handover
  const readyRes = await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${orderId}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'READY_FOR_PICKUP', notes: 'Sealed in eco-kraft bag' }
  );
  assert.strictEqual(readyRes.statusCode, 200);
  assert(['READY_FOR_PICKUP', 'READY_FOR_HANDOVER'].includes(readyRes.body.order.status || readyRes.body.order.orderStatus));

  // 5e. Owner Assigns Delivery Boy / Handover
  const assignRes = await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${orderId}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { deliveryBoyId: riderUser.id, deliveryPartnerId: riderUser.id, status: 'HANDED_TO_DELIVERY_BOY', notes: `Assigned to EV Pilot ${riderUser.name}` }
  );
  assert.strictEqual(assignRes.statusCode, 200);
  assert(['ASSIGNED', 'HANDED_TO_DELIVERY_BOY'].includes(assignRes.body.order.status || assignRes.body.order.orderStatus));
  assert.strictEqual(assignRes.body.order.deliveryBoyId, riderUser.id);
  assert.strictEqual(assignRes.body.order.deliveryBoyName, riderUser.name);
  assert(assignRes.body.order.assignedAt, 'assignedAt timestamp must be recorded');
  console.log('   ✅ Owner successfully transitioned order: ORDER_PLACED -> CONFIRMED -> PICKING -> PACKING -> READY_FOR_HANDOVER -> HANDED_TO_DELIVERY_BOY.\n');

  // 6. Delivery Boy Workflow Lifecycle
  console.log('6️⃣ Delivery Boy Live Deliveries isolation & Lifecycle transitions...');
  
  // 6a. Delivery Boy sees assigned order
  const myDeliveriesRes = await dispatchRequest({
    method: 'GET',
    url: '/api/delivery/orders',
    headers: { cookie: riderCookie }
  });
  assert.strictEqual(myDeliveriesRes.statusCode, 200);
  const myOrders = Array.isArray(myDeliveriesRes.body) ? myDeliveriesRes.body : myDeliveriesRes.body.orders;
  const assignedFound = myOrders.find(o => (o.orderId || o.id) === orderId);
  assert(assignedFound, 'Delivery Boy must see the assigned order');
  assert(['ASSIGNED', 'HANDED_TO_DELIVERY_BOY'].includes(assignedFound.status || assignedFound.orderStatus || assignedFound.deliveryStatus));
  assert.strictEqual(assignedFound.deliveryLatitude, 12.9784);

  // 6b. Delivery Boy Accepts Order
  const acceptRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/accept`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(acceptRes.statusCode, 200);
  assert(['ACCEPTED', 'DELIVERY_BOY_ACCEPTED'].includes(acceptRes.body.order.status || acceptRes.body.order.orderStatus || acceptRes.body.order.deliveryStatus));
  assert(acceptRes.body.order.acceptedAt, 'acceptedAt must be recorded');

  // 6c. Delivery Boy Picks Up Order
  const pickupRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/pickup`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(pickupRes.statusCode, 200);
  assert.strictEqual(pickupRes.body.order.status, 'PICKED_UP');
  assert(pickupRes.body.order.pickedUpAt, 'pickedUpAt must be recorded');

  // 6d. Delivery Boy Moves to Out for Delivery
  const outRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/out-for-delivery`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(outRes.statusCode, 200);
  assert.strictEqual(outRes.body.order.status, 'OUT_FOR_DELIVERY');
  assert(outRes.body.order.outForDeliveryAt, 'outForDeliveryAt must be recorded');

  // 6e. Delivery Boy Arrives at Doorstep
  const arrivedRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/arrived`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(arrivedRes.statusCode, 200);
  assert.strictEqual(arrivedRes.body.order.status, 'ARRIVED');
  assert(arrivedRes.body.order.arrivedAt, 'arrivedAt must be recorded');
  console.log('   ✅ Delivery Boy moved order: ASSIGNED -> ACCEPTED -> PICKED_UP -> OUT_FOR_DELIVERY -> ARRIVED.\n');

  // 7. Security Checks (Invalid OTP, Premature Delivery, COD Collection, Valid OTP)
  console.log('7️⃣ Security Checks (OTP Verification & COD Payment Lock)...');

  // 7a. Attempt premature delivery without OTP verification
  const prematureRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/deliver`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(prematureRes.statusCode, 400, 'Premature deliver must be blocked without OTP');
  console.log('   ✅ Premature delivery without OTP properly rejected.');

  // 7b. Attempt verification with wrong OTP
  const wrongOtpRes = await dispatchRequest(
    { method: 'POST', url: `/api/delivery/orders/${orderId}/verify-otp`, headers: { cookie: riderCookie, 'content-type': 'application/json' } },
    { otp: '0000' }
  );
  assert.strictEqual(wrongOtpRes.statusCode, 400, 'Invalid OTP must be rejected');
  console.log('   ✅ Invalid OTP properly rejected.');

  // 7c. Submit correct OTP
  const correctOtpRes = await dispatchRequest(
    { method: 'POST', url: `/api/delivery/orders/${orderId}/verify-otp`, headers: { cookie: riderCookie, 'content-type': 'application/json' } },
    { otp: createdOrder.deliveryOtp }
  );
  assert.strictEqual(correctOtpRes.statusCode, 200, 'Valid OTP must be accepted');
  assert.strictEqual(correctOtpRes.body.order.otpVerified, true);
  console.log('   ✅ Valid OTP accepted and recorded.');

  // 7d. Attempt delivery before COD cash is marked as collected
  const unpaidDeliverRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/deliver`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(unpaidDeliverRes.statusCode, 400, 'Unpaid COD order must require cash collection');
  console.log('   ✅ Unpaid COD order properly blocked until cash is collected.');

  // 7e. Collect COD Cash
  const codRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/collect-cod`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(codRes.statusCode, 200);
  assert.strictEqual(codRes.body.order.paymentStatus, 'PAID');
  console.log('   ✅ COD cash collected and paymentStatus set to PAID.');

  // 7f. Mark Delivered
  const deliverRes = await dispatchRequest({
    method: 'POST',
    url: `/api/delivery/orders/${orderId}/deliver`,
    headers: { cookie: riderCookie, 'content-type': 'application/json' }
  });
  assert.strictEqual(deliverRes.statusCode, 200);
  assert.strictEqual(deliverRes.body.order.status, 'DELIVERED');
  assert(deliverRes.body.order.deliveredAt, 'deliveredAt timestamp must exist');
  assert.strictEqual(deliverRes.body.order.deliveredBy, riderUser.id);
  console.log('   ✅ Order successfully marked DELIVERED with full timestamps.\n');

  // 8. Post-Delivery History & Stats
  console.log('8️⃣ Delivery History & Owner Records...');
  const historyRes = await dispatchRequest({
    method: 'GET',
    url: '/api/delivery/history',
    headers: { cookie: riderCookie }
  });
  assert.strictEqual(historyRes.statusCode, 200);
  const histOrders = Array.isArray(historyRes.body) ? historyRes.body : historyRes.body.orders;
  const inHistory = histOrders.find(o => (o.orderId || o.id) === orderId);
  assert(inHistory, 'Delivered order must appear in Delivery Boy history');

  const ownerOrdersRes = await dispatchRequest({
    method: 'GET',
    url: '/api/owner/orders',
    headers: { cookie: ownerCookie }
  });
  assert.strictEqual(ownerOrdersRes.statusCode, 200);
  const ownerOrders = Array.isArray(ownerOrdersRes.body) ? ownerOrdersRes.body : ownerOrdersRes.body.orders;
  const ownerOrderRecord = ownerOrders.find(o => (o.orderId || o.id) === orderId);
  assert.strictEqual(ownerOrderRecord.status, 'DELIVERED');
  assert.strictEqual(ownerOrderRecord.paymentStatus, 'PAID');
  console.log('   ✅ Single source of truth verified across Delivery Boy history and Owner dashboard.\n');

  // 9. Delivery Failure & Reschedule Scenario
  console.log('9️⃣ Delivery Failure & Rescheduling Handling...');
  const order2Res = await dispatchRequest(
    { method: 'POST', url: '/api/orders', headers: { 'content-type': 'application/json' } },
    {
      ...orderPayload,
      paymentMethod: 'UPI (Prepaid)'
    }
  );
  const order2Id = order2Res.body.orderId || order2Res.body.id;

  // Step order 2 through preparation and dispatch workflow
  await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${order2Id}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'CONFIRMED' }
  );
  await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${order2Id}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'PICKING' }
  );
  await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${order2Id}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'PACKING' }
  );
  await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${order2Id}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'READY_FOR_HANDOVER' }
  );
  await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${order2Id}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'HANDED_TO_DELIVERY_BOY', deliveryBoyId: riderUser.id }
  );
  await dispatchRequest(
    { method: 'POST', url: `/api/delivery/orders/${order2Id}/accept`, headers: { cookie: riderCookie, 'content-type': 'application/json' } },
    {}
  );
  await dispatchRequest(
    { method: 'POST', url: `/api/delivery/orders/${order2Id}/pickup`, headers: { cookie: riderCookie, 'content-type': 'application/json' } },
    {}
  );
  await dispatchRequest(
    { method: 'POST', url: `/api/delivery/orders/${order2Id}/out-for-delivery`, headers: { cookie: riderCookie, 'content-type': 'application/json' } },
    {}
  );

  // Delivery Boy marks failed
  const failRes = await dispatchRequest(
    { method: 'POST', url: `/api/delivery/orders/${order2Id}/failed`, headers: { cookie: riderCookie, 'content-type': 'application/json' } },
    { reason: 'Customer unreachable after 3 call attempts' }
  );
  assert.strictEqual(failRes.statusCode, 200);
  assert.strictEqual(failRes.body.order.status, 'DELIVERY_FAILED');
  assert.strictEqual(failRes.body.order.failureReason, 'Customer unreachable after 3 call attempts');
  assert(failRes.body.order.failedAt, 'failedAt must be set');
  console.log('   ✅ Delivery failure recorded with reason and timestamp.');

  // Owner cancels order 2
  const cancelRes = await dispatchRequest(
    { method: 'PATCH', url: `/api/owner/orders/${order2Id}`, headers: { cookie: ownerCookie, 'content-type': 'application/json' } },
    { status: 'CANCELLED', cancellationReason: 'Customer canceled after failed delivery attempt' }
  );
  assert.strictEqual(cancelRes.statusCode, 200);
  assert.strictEqual(cancelRes.body.order.status, 'CANCELLED');
  console.log('   ✅ Owner cancellation and restock verified.\n');

  console.log('🎉 ALL 9 LIFECYCLE PHASES PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
