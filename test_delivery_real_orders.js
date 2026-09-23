const http = require('http');

function makeRequest(options, postData = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const headers = options.headers || {};
    if (cookie) headers['Cookie'] = cookie;
    if (postData) {
      const dataStr = typeof postData === 'string' ? postData : JSON.stringify(postData);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(dataStr);
    }
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: options.path,
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          setCookies,
          body: json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function extractSessionCookie(setCookies) {
  for (const c of setCookies) {
    if (c.startsWith('freshmart_session=')) {
      return c.split(';')[0];
    }
  }
  return '';
}

async function runTests() {
  console.log('🚀 Starting Delivery Boy Real Order Assignment & Dashboard Tests...\n');

  let passed = 0;
  let total = 0;

  function assert(cond, desc) {
    total++;
    if (cond) {
      console.log(`✅ TEST ${total}: ${desc}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${desc}`);
    }
  }

  try {
    // Step 1: Login as Owner
    const ownerLogin = await makeRequest({ path: '/api/auth/login', method: 'POST' }, {
      identifier: 'piyushverma730929@gmail.com',
      password: 'FreshMart@2026'
    });
    const ownerCookie = extractSessionCookie(ownerLogin.setCookies);
    assert(ownerLogin.statusCode === 200 && ownerCookie, 'Owner authenticates successfully');

    // Step 2: Fetch Staff to get Pappu and Kannu
    const staffRes = await makeRequest({ path: '/api/owner/staff', method: 'GET' }, null, ownerCookie);
    assert(staffRes.statusCode === 200 && Array.isArray(staffRes.body), 'Owner fetches staff list');
    
    const pappu = staffRes.body.find(s => s.email === 'pappu@gmail.com' || s.phone === '7300212948');
    const kannu = staffRes.body.find(s => s.name.toLowerCase().includes('kannu') || s.email.includes('kannu'));
    assert(pappu && pappu.role === 'Delivery Boy', 'Pappu exists as an active Delivery Boy in Staff');
    assert(kannu && kannu.role === 'Delivery Boy', 'Kannu exists as an active Delivery Boy in Staff');

    // Step 3: Create a Real Fresh Mart Order
    const createOrderRes = await makeRequest({ path: '/api/orders', method: 'POST' }, {
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
    assert(createOrderRes.statusCode === 201 && createOrderRes.body.id, 'Real fresh order placed in database');
    const testOrder = createOrderRes.body;
    const testOrderId = testOrder.id;

    // Step 4: Owner Assigns Order to Pappu
    const assignRes = await makeRequest({ path: `/api/owner/orders/${testOrderId}`, method: 'PATCH' }, {
      deliveryBoyId: pappu.id,
      deliveryPartnerId: pappu.id,
      status: 'ASSIGNED'
    }, ownerCookie);
    assert(assignRes.statusCode === 200, `Owner assigns order #${testOrderId} to Delivery Boy Pappu`);
    assert(assignRes.body.order.deliveryBoyId === pappu.id && assignRes.body.order.deliveryStatus === 'ASSIGNED', 'Order record updated with deliveryBoyId and deliveryStatus = ASSIGNED');

    // Step 5: Pappu Logs In
    const pappuLogin = await makeRequest({ path: '/api/auth/login', method: 'POST' }, {
      identifier: 'pappu@gmail.com',
      password: 'Freshmart'
    });
    const pappuCookie = extractSessionCookie(pappuLogin.setCookies);
    assert(pappuLogin.statusCode === 200 && pappuCookie, 'Pappu logs in as Delivery Boy');

    // Step 6: Pappu Fetches /api/delivery/orders -> Strictly sees their assigned order
    const pappuOrdersRes = await makeRequest({ path: '/api/delivery/orders', method: 'GET' }, null, pappuCookie);
    assert(pappuOrdersRes.statusCode === 200 && Array.isArray(pappuOrdersRes.body), 'Pappu fetches scoped orders');
    const pappuOrder = pappuOrdersRes.body.find(o => o.id === testOrderId);
    assert(!!pappuOrder, `Pappu strictly sees assigned order #${testOrderId}`);

    // Step 7: Kannu Logs In -> Verify Kannu does NOT see Pappu's assigned order
    const kannuLogin = await makeRequest({ path: '/api/auth/login', method: 'POST' }, {
      identifier: 'kannu.rider@freshmart.com',
      password: 'FreshMart@2026'
    });
    const kannuCookie = extractSessionCookie(kannuLogin.setCookies);
    assert(kannuLogin.statusCode === 200 && kannuCookie, 'Kannu logs in as Delivery Boy');

    const kannuOrdersRes = await makeRequest({ path: '/api/delivery/orders', method: 'GET' }, null, kannuCookie);
    assert(kannuOrdersRes.statusCode === 200, 'Kannu fetches scoped orders');
    const kannuSawPappuOrder = (kannuOrdersRes.body || []).some(o => o.id === testOrderId);
    assert(!kannuSawPappuOrder, `Strict privacy isolation: Kannu CANNOT see Pappu's assigned order #${testOrderId}`);

    // Step 8: Pappu performs full Delivery Lifecycle transitions
    // Transition 8a: ASSIGNED -> ACCEPTED
    const acceptRes = await makeRequest({ path: `/api/delivery/orders/${testOrderId}/status`, method: 'PATCH' }, {
      status: 'ACCEPTED'
    }, pappuCookie);
    assert(acceptRes.statusCode === 200 && acceptRes.body.order.deliveryStatus === 'ACCEPTED', 'Delivery Boy accepts order (ASSIGNED -> ACCEPTED)');

    // Transition 8b: ACCEPTED -> PICKED_UP
    const pickupRes = await makeRequest({ path: `/api/delivery/orders/${testOrderId}/status`, method: 'PATCH' }, {
      status: 'PICKED_UP'
    }, pappuCookie);
    assert(pickupRes.statusCode === 200 && pickupRes.body.order.deliveryStatus === 'PICKED_UP', 'Delivery Boy confirms pickup from hub (ACCEPTED -> PICKED_UP)');

    // Transition 8c: PICKED_UP -> OUT_FOR_DELIVERY
    const outRes = await makeRequest({ path: `/api/delivery/orders/${testOrderId}/status`, method: 'PATCH' }, {
      status: 'OUT_FOR_DELIVERY'
    }, pappuCookie);
    assert(outRes.statusCode === 200 && outRes.body.order.deliveryStatus === 'OUT_FOR_DELIVERY', 'Delivery Boy starts delivery (PICKED_UP -> OUT_FOR_DELIVERY)');

    // Transition 8d: OUT_FOR_DELIVERY -> ARRIVED
    const arrivedRes = await makeRequest({ path: `/api/delivery/orders/${testOrderId}/status`, method: 'PATCH' }, {
      status: 'ARRIVED'
    }, pappuCookie);
    assert(arrivedRes.statusCode === 200 && arrivedRes.body.order.deliveryStatus === 'ARRIVED', 'Delivery Boy marks arrived at doorstep (OUT_FOR_DELIVERY -> ARRIVED)');

    // Transition 8e: ARRIVED -> DELIVERED
    const deliverRes = await makeRequest({ path: `/api/delivery/orders/${testOrderId}/status`, method: 'PATCH' }, {
      status: 'DELIVERED'
    }, pappuCookie);
    assert(deliverRes.statusCode === 200 && deliverRes.body.order.deliveryStatus === 'DELIVERED', 'Delivery Boy completes delivery (ARRIVED -> DELIVERED)');

    // Step 9: Owner checks order status -> Synchronized real-time
    const ownerOrderCheck = await makeRequest({ path: `/api/owner/orders/${testOrderId}`, method: 'GET' }, null, ownerCookie);
    assert(ownerOrderCheck.statusCode === 200, 'Owner fetches updated order');
    assert(ownerOrderCheck.body.deliveryStatus === 'DELIVERED' && ownerOrderCheck.body.orderStatus === 'DELIVERED', 'Owner view confirms order is DELIVERED');
    assert(ownerOrderCheck.body.paymentStatus === 'PAID', 'Payment status automatically updated to PAID upon delivery');
    assert(Array.isArray(ownerOrderCheck.body.timeline) && ownerOrderCheck.body.timeline.length >= 5, 'Order timeline contains full chronological lifecycle audit trail');

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} / ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
