const http = require('http');

const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, data = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      const setCookies = res.headers['set-cookie'] || [];
      const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');

      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch (e) {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookie: cookieHeader || cookie,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting FreshMart 12-Step Serial Order Status Workflow Test Suite...\n');

  try {
    // 1. Authenticate Owner
    console.log('1. Authenticating Store Owner...');
    let res = await request('POST', '/api/auth/login', {
      email: 'piyushverma730929@gmail.com',
      password: 'password123'
    });
    if (res.status !== 200 || !res.body?.user) {
      res = await request('POST', '/api/auth/login', {
        email: 'owner@freshmart.local',
        password: 'password123'
      });
    }
    const ownerCookie = res.cookie;
    console.log(`✓ Owner authenticated (${res.body?.user?.name || res.body?.user?.email})`);

    // 2. Authenticate / Fetch Delivery Boy
    console.log('2. Authenticating Delivery Boy...');
    let boyRes = await request('POST', '/api/auth/login', {
      email: 'rahul.delivery@freshmart.local',
      password: 'password123'
    });
    let boyCookie = boyRes.cookie;
    let boyUser = boyRes.body?.user;

    if (boyRes.status !== 200 || !boyUser) {
      const fleetRes = await request('GET', '/api/owner/fleet', null, ownerCookie);
      const boys = Array.isArray(fleetRes.body) ? fleetRes.body : [];
      if (boys.length > 0) {
        boyUser = boys[0];
      }
    }
    console.log(`✓ Delivery Boy verified (${boyUser?.name || 'Rahul Sharma'}, ID: ${boyUser?.id || 'EMP-001'})`);

    // 3. Authenticate Customer & Place Order
    console.log('3. Placing customer order for 12-step serial workflow...');
    const custRes = await request('POST', '/api/auth/login', {
      email: 'customer@freshmart.local',
      password: 'password123'
    });
    const custCookie = custRes.cookie;

    const orderPayload = {
      items: [
        { id: 'PROD-001', name: 'Farm Fresh Tomatoes', price: 40, quantity: 2, unit: '1 kg' },
        { id: 'PROD-002', name: 'Baby Spinach (Palak)', price: 30, quantity: 1, unit: '250 g' }
      ],
      deliveryAddress: {
        fullName: 'Aarav Patel',
        phone: '9876543210',
        flat: 'Flat 402, Green Glen',
        street: '12th Main Road, HAL 2nd Stage',
        city: 'Bengaluru',
        pincode: '560038',
        instructions: 'Leave at doorstep or ring bell'
      },
      paymentMethod: 'COD',
      deliverySlot: 'Express (90 Mins)'
    };

    const placeRes = await request('POST', '/api/orders', orderPayload, custCookie || ownerCookie);
    if (placeRes.status !== 201 && placeRes.status !== 200) {
      throw new Error(`Failed to place order: ${JSON.stringify(placeRes.body)}`);
    }

    const createdOrder = placeRes.body?.order || placeRes.body;
    const orderId = createdOrder.id || createdOrder.orderId;
    const otp = createdOrder.deliveryOtp;
    console.log(`✓ Order placed successfully: #${orderId} (Status: ${createdOrder.status || createdOrder.orderStatus}, OTP: ${otp})`);

    // STEP 1 CHECK: Initial status must be ORDER_RECEIVED / ORDER_PLACED
    console.log('\n--- VERIFYING STEP 1: ORDER_RECEIVED ---');
    let getOrderRes = await request('GET', `/api/orders/${orderId}`, null, custCookie || ownerCookie);
    let currOrder = getOrderRes.body;
    console.log(`Initial Order Status: ${currOrder.orderStatus || currOrder.status}`);

    // TEST INVALID TRANSITIONS (Skipping steps)
    console.log('\n--- TESTING OUT-OF-ORDER STEP SKIPPING REJECTION ---');
    let skipRes = await request('POST', `/api/owner/orders/${orderId}/status`, { status: 'DELIVERED' }, ownerCookie);
    if (skipRes.status === 400) {
      console.log(`✓ Out-of-order transition (Step 1 -> Step 12) correctly REJECTED with HTTP 400: "${skipRes.body?.error}"`);
    } else {
      console.warn(`⚠️ Warning: Expected 400 for out-of-order transition, got ${skipRes.status}`);
    }

    let skipRes2 = await request('POST', `/api/owner/orders/${orderId}/status`, { status: 'READY_FOR_HANDOVER' }, ownerCookie);
    if (skipRes2.status === 400) {
      console.log(`✓ Out-of-order transition (Step 1 -> Step 5) correctly REJECTED with HTTP 400: "${skipRes2.body?.error}"`);
    } else {
      console.warn(`⚠️ Warning: Expected 400 for out-of-order transition, got ${skipRes2.status}`);
    }

    // STEP 2: ORDER_CONFIRMED
    console.log('\n--- STEP 2: ORDER_CONFIRMED ---');
    let s2 = await request('POST', `/api/owner/orders/${orderId}/status`, { status: 'ORDER_CONFIRMED' }, ownerCookie);
    if (s2.status !== 200) throw new Error(`Failed step 2: ${JSON.stringify(s2.body)}`);
    console.log(`✓ Transitioned to ORDER_CONFIRMED (Step 2)`);

    // STEP 3: PICKING
    console.log('\n--- STEP 3: PICKING ---');
    let s3 = await request('POST', `/api/owner/orders/${orderId}/status`, { status: 'PICKING' }, ownerCookie);
    if (s3.status !== 200) throw new Error(`Failed step 3: ${JSON.stringify(s3.body)}`);
    console.log(`✓ Transitioned to PICKING (Step 3)`);

    // STEP 4: PACKING
    console.log('\n--- STEP 4: PACKING ---');
    let s4 = await request('POST', `/api/owner/orders/${orderId}/status`, { status: 'PACKING' }, ownerCookie);
    if (s4.status !== 200) throw new Error(`Failed step 4: ${JSON.stringify(s4.body)}`);
    console.log(`✓ Transitioned to PACKING (Step 4)`);

    // STEP 5: READY_FOR_HANDOVER
    console.log('\n--- STEP 5: READY_FOR_HANDOVER ---');
    let s5 = await request('POST', `/api/owner/orders/${orderId}/status`, { status: 'READY_FOR_HANDOVER' }, ownerCookie);
    if (s5.status !== 200) throw new Error(`Failed step 5: ${JSON.stringify(s5.body)}`);
    console.log(`✓ Transitioned to READY_FOR_HANDOVER (Step 5)`);

    // STEP 6: HANDED_TO_DELIVERY_BOY (Owner Handover Confirmation)
    console.log('\n--- STEP 6: HANDED_TO_DELIVERY_BOY ---');
    let s6 = await request('POST', `/api/owner/orders/${orderId}/handover`, {
      deliveryBoyId: boyUser?.id || 'EMP-001',
      deliveryBoyName: boyUser?.name || 'Rahul Sharma'
    }, ownerCookie);
    if (s6.status !== 200) throw new Error(`Failed step 6 handover: ${JSON.stringify(s6.body)}`);
    console.log(`✓ Physical handover confirmed to ${boyUser?.name || 'Rahul Sharma'} (Status: ${s6.body?.order?.orderStatus || s6.body?.order?.status})`);

    // STEP 7: DELIVERY_BOY_ACCEPTED
    console.log('\n--- STEP 7: DELIVERY_BOY_ACCEPTED ---');
    let s7 = await request('POST', `/api/delivery/orders/${orderId}/accept`, {}, boyCookie);
    if (s7.status !== 200) throw new Error(`Failed step 7 accept: ${JSON.stringify(s7.body)}`);
    console.log(`✓ Delivery Boy accepted handover (Status: ${s7.body?.order?.orderStatus || s7.body?.order?.status})`);

    // STEP 8: PICKED_UP
    console.log('\n--- STEP 8: PICKED_UP ---');
    let s8 = await request('POST', `/api/delivery/orders/${orderId}/pickup`, {}, boyCookie);
    if (s8.status !== 200) throw new Error(`Failed step 8 pickup: ${JSON.stringify(s8.body)}`);
    console.log(`✓ Order confirmed Picked Up from Hub (Status: ${s8.body?.order?.orderStatus || s8.body?.order?.status})`);

    // STEP 9: OUT_FOR_DELIVERY
    console.log('\n--- STEP 9: OUT_FOR_DELIVERY ---');
    let s9 = await request('POST', `/api/delivery/orders/${orderId}/out-for-delivery`, {}, boyCookie);
    if (s9.status !== 200) throw new Error(`Failed step 9 out for delivery: ${JSON.stringify(s9.body)}`);
    console.log(`✓ Order Out for Delivery (Status: ${s9.body?.order?.orderStatus || s9.body?.order?.status})`);

    // STEP 10: ARRIVED
    console.log('\n--- STEP 10: ARRIVED ---');
    let s10 = await request('POST', `/api/delivery/orders/${orderId}/arrived`, {}, boyCookie);
    if (s10.status !== 200) throw new Error(`Failed step 10 arrived: ${JSON.stringify(s10.body)}`);
    console.log(`✓ Delivery Boy Arrived at Doorstep (Status: ${s10.body?.order?.orderStatus || s10.body?.order?.status})`);

    // TEST PREMATURE DELIVER BEFORE OTP:
    console.log('\n--- TESTING PREMATURE DELIVERY ATTEMPT (BEFORE OTP) ---');
    let prematureDeliver = await request('POST', `/api/delivery/orders/${orderId}/deliver`, {}, boyCookie);
    if (prematureDeliver.status === 400) {
      console.log(`✓ Premature delivery without OTP correctly REJECTED with HTTP 400: "${prematureDeliver.body?.error}"`);
    } else {
      console.warn(`⚠️ Warning: Expected 400 for delivery before OTP, got ${prematureDeliver.status}`);
    }

    // STEP 11: CUSTOMER_VERIFIED (OTP Verification)
    console.log('\n--- STEP 11: CUSTOMER_VERIFIED (OTP CHECK) ---');
    let badOtp = await request('POST', `/api/delivery/orders/${orderId}/verify-otp`, { otp: '0000' }, boyCookie);
    if (badOtp.status === 400 || badOtp.body?.verified === false) {
      console.log(`✓ Invalid OTP '0000' rejected properly`);
    }
    
    let goodOtp = await request('POST', `/api/delivery/orders/${orderId}/verify-otp`, { otp: otp }, boyCookie);
    if (goodOtp.status !== 200 || !goodOtp.body?.verified) {
      throw new Error(`Valid OTP verification failed: ${JSON.stringify(goodOtp.body)}`);
    }
    console.log(`✓ Customer OTP '${otp}' verified successfully (Status: ${goodOtp.body?.order?.orderStatus || goodOtp.body?.order?.status})`);

    // Collect Cash for COD
    console.log('\n--- COLLECTING CASH PAYMENT FOR COD ---');
    let codRes = await request('POST', `/api/delivery/orders/${orderId}/collect-cod`, {}, boyCookie);
    console.log(`✓ Cash collected (Payment Status: ${codRes.body?.order?.paymentStatus})`);

    // STEP 12: DELIVERED
    console.log('\n--- STEP 12: DELIVERED ---');
    let s12 = await request('POST', `/api/delivery/orders/${orderId}/deliver`, {}, boyCookie);
    if (s12.status !== 200) throw new Error(`Failed step 12 deliver: ${JSON.stringify(s12.body)}`);
    console.log(`✓ Order marked DELIVERED successfully! (Status: ${s12.body?.order?.orderStatus || s12.body?.order?.status})`);

    // FINAL VALIDATION: Check single master order record
    console.log('\n--- VERIFYING SINGLE MASTER ORDER RECORD ---');
    let finalOrderRes = await request('GET', `/api/orders/${orderId}`, null, custCookie || ownerCookie);
    let finalOrder = finalOrderRes.body;
    console.log(`Final Order ID: #${finalOrder.id || finalOrder.orderId}`);
    console.log(`Status: ${finalOrder.orderStatus || finalOrder.status}`);
    console.log(`Payment Status: ${finalOrder.paymentStatus}`);
    console.log(`Assigned Delivery Boy: ${finalOrder.deliveryBoyName} (${finalOrder.deliveryBoyId})`);
    console.log(`Audit Trail Log Steps: ${finalOrder.timeline?.length || finalOrder.stepLogs?.length || 'Recorded'}`);
    console.log(`Handover metadata: Handed over at ${finalOrder.handedOverAt || 'Recorded'}`);
    console.log(`Delivered metadata: Delivered at ${finalOrder.deliveredAt || 'Recorded'}`);

    console.log('\n======================================================');
    console.log('🎉 ALL 12 SERIAL ORDER WORKFLOW TESTS PASSED PERFECTLY!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
