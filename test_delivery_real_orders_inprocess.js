/**
 * FreshMart Delivery Boy Real Orders & Lifecycle In-Process Test Suite
 */

const assert = require('assert');
const { PassThrough, EventEmitter } = require('stream');
const db = require('./database');
const server = require('./server');

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

async function runTestSuite() {
  console.log('🚀 Starting Delivery Boy Real Order Assignment & Dashboard Lifecycle Tests...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
      failed++;
    }
  }

  let ownerCookie = null;
  let pappuUser = null;
  let kannuUser = null;
  let pappuCookie = null;
  let kannuCookie = null;
  let testOrder = null;

  await test('1. Store Owner authenticates successfully', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login'
    }, {
      identifier: 'piyushverma730929@gmail.com',
      password: 'FreshMart@2026'
    });
    assert.strictEqual(res.statusCode, 200);
    ownerCookie = extractCookie(res.headers);
    assert.ok(ownerCookie, 'Owner session cookie obtained');
  });

  await test('2. Owner verifies active Delivery Boys in Staff & Sub-Admins', async () => {
    const res = await dispatchRequest({
      method: 'GET',
      url: '/api/owner/staff',
      headers: { Cookie: ownerCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    pappuUser = res.body.find(s => s.email === 'pappu@gmail.com' || s.phone === '7300212948');
    kannuUser = res.body.find(s => s.name.toLowerCase().includes('kannu') || s.email.includes('kannu'));
    assert.ok(pappuUser, 'Pappu exists in staff');
    assert.strictEqual(pappuUser.role, 'Delivery Boy');
    assert.ok(kannuUser, 'Kannu exists in staff');
  });

  await test('3. Real Fresh Mart order is placed in data.orders', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/orders'
    }, {
      customerName: 'Aarav Sharma',
      customerPhone: '9876543210',
      deliveryAddress: {
        fullName: 'Aarav Sharma',
        flat: 'Flat 402, Green Meadows',
        street: '100ft Road, Indiranagar',
        city: 'Bengaluru',
        pincode: '560038'
      },
      paymentMethod: 'COD',
      items: [
        { id: 'prod_1', name: 'Fresh Organic Spinach', price: 45, qty: 2 },
        { id: 'prod_2', name: 'Farm Fresh Tomatoes', price: 35, qty: 1 }
      ]
    });
    assert.strictEqual(res.statusCode, 201);
    testOrder = res.body;
    assert.ok(testOrder.id);
  });

  await test('4. Owner assigns order to active delivery boy Pappu', async () => {
    const res = await dispatchRequest({
      method: 'PATCH',
      url: `/api/owner/orders/${testOrder.id}`,
      headers: { Cookie: ownerCookie }
    }, {
      deliveryBoyId: pappuUser.id,
      deliveryPartnerId: pappuUser.id,
      status: 'ASSIGNED'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.order.deliveryBoyId, pappuUser.id);
    assert.strictEqual(res.body.order.deliveryStatus, 'ASSIGNED');
    assert.ok(res.body.order.assignedAt);
  });

  await test('5. Delivery Boy Pappu authenticates', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login'
    }, {
      identifier: 'pappu@gmail.com',
      password: 'Freshmart'
    });
    assert.strictEqual(res.statusCode, 200);
    pappuCookie = extractCookie(res.headers);
    assert.ok(pappuCookie, 'Pappu session cookie obtained');
  });

  await test('6. Delivery Boy Pappu fetches scoped /api/delivery/orders -> Strictly sees assigned order', async () => {
    const res = await dispatchRequest({
      method: 'GET',
      url: '/api/delivery/orders',
      headers: { Cookie: pappuCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    const myOrder = res.body.find(o => o.id === testOrder.id);
    assert.ok(myOrder, 'Pappu can see their assigned order');
    assert.strictEqual(myOrder.deliveryBoyId, pappuUser.id);
    assert.strictEqual(myOrder.deliveryStatus, 'ASSIGNED');
  });

  await test('7. Delivery Boy Kannu authenticates & verifies strict data isolation (cannot see Pappu order)', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login'
    }, {
      identifier: 'kannu.rider@freshmart.com',
      password: 'FreshMart@2026'
    });
    assert.strictEqual(res.statusCode, 200);
    kannuCookie = extractCookie(res.headers);

    const kannuOrdersRes = await dispatchRequest({
      method: 'GET',
      url: '/api/delivery/orders',
      headers: { Cookie: kannuCookie }
    });
    assert.strictEqual(kannuOrdersRes.statusCode, 200);
    const seesPappuOrder = (kannuOrdersRes.body || []).some(o => o.id === testOrder.id);
    assert.strictEqual(seesPappuOrder, false, 'Kannu cannot see order assigned to Pappu');
  });

  await test('8. Pappu lifecycle transition 1: ASSIGNED -> ACCEPTED', async () => {
    const res = await dispatchRequest({
      method: 'PATCH',
      url: `/api/delivery/orders/${testOrder.id}/status`,
      headers: { Cookie: pappuCookie }
    }, {
      status: 'ACCEPTED'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.order.deliveryStatus, 'ACCEPTED');
  });

  await test('9. Pappu lifecycle transition 2: ACCEPTED -> PICKED_UP', async () => {
    const res = await dispatchRequest({
      method: 'PATCH',
      url: `/api/delivery/orders/${testOrder.id}/status`,
      headers: { Cookie: pappuCookie }
    }, {
      status: 'PICKED_UP'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.order.deliveryStatus, 'PICKED_UP');
    assert.strictEqual(res.body.order.orderStatus, 'PICKED_UP');
  });

  await test('10. Pappu lifecycle transition 3: PICKED_UP -> OUT_FOR_DELIVERY', async () => {
    const res = await dispatchRequest({
      method: 'PATCH',
      url: `/api/delivery/orders/${testOrder.id}/status`,
      headers: { Cookie: pappuCookie }
    }, {
      status: 'OUT_FOR_DELIVERY'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.order.deliveryStatus, 'OUT_FOR_DELIVERY');
    assert.strictEqual(res.body.order.orderStatus, 'OUT_FOR_DELIVERY');
  });

  await test('11. Pappu lifecycle transition 4: OUT_FOR_DELIVERY -> ARRIVED', async () => {
    const res = await dispatchRequest({
      method: 'PATCH',
      url: `/api/delivery/orders/${testOrder.id}/status`,
      headers: { Cookie: pappuCookie }
    }, {
      status: 'ARRIVED'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.order.deliveryStatus, 'ARRIVED');
    assert.strictEqual(res.body.order.orderStatus, 'ARRIVED');
  });

  await test('12. Pappu lifecycle transition 5: ARRIVED -> DELIVERED', async () => {
    const res = await dispatchRequest({
      method: 'PATCH',
      url: `/api/delivery/orders/${testOrder.id}/status`,
      headers: { Cookie: pappuCookie }
    }, {
      status: 'DELIVERED'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.order.deliveryStatus, 'DELIVERED');
    assert.strictEqual(res.body.order.orderStatus, 'DELIVERED');
    assert.strictEqual(res.body.order.paymentStatus, 'PAID');
    assert.ok(res.body.order.deliveredAt);
  });

  await test('13. Owner Live Orders view reflects real-time status and audit milestones', async () => {
    const res = await dispatchRequest({
      method: 'GET',
      url: `/api/owner/orders/${testOrder.id}`,
      headers: { Cookie: ownerCookie }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.deliveryStatus, 'DELIVERED');
    assert.strictEqual(res.body.orderStatus, 'DELIVERED');
    assert.strictEqual(res.body.paymentStatus, 'PAID');
    assert.ok(Array.isArray(res.body.timeline) && res.body.timeline.length >= 5);
  });

  console.log(`\n==================================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`==================================================\n`);

  if (failed === 0) {
    console.log('🎉 ALL 13/13 DELIVERY BOY REAL ORDER & DASHBOARD TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
