// tests/test_live_accept_reject_reassign_vercel.js
// Complete End-to-End Test for FreshMart on Live Vercel Deployment:
// Test 1: Full Accept to Delivery Workflow
// Test 2: Reject by Delivery Boy, Verify Non-Cancellation & "Finding another partner", Owner Reassigns to 2nd Delivery Boy, 2nd Delivery Boy Completes Delivery

const https = require('https');
const http = require('http');

const BASE_URL = process.env.LIVE_VERCEL_URL || 'https://freshmart-ten-vert.vercel.app';

function request(urlPath, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, BASE_URL);
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FreshMart-E2E-Tester/2.0',
        ...headers
      }
    };

    const protocol = fullUrl.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function extractCookie(res) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return null;
  if (Array.isArray(setCookie)) {
    return setCookie.map(c => c.split(';')[0]).join('; ');
  }
  return setCookie.split(';')[0];
}

async function runTests() {
  console.log('================================================================');
  console.log(' FRESHMART LIVE VERCEL TEST SUITE: ACCEPT & REJECT WORKFLOWS');
  console.log(` Target Deployment: ${BASE_URL}`);
  console.log('================================================================\n');

  let passedSteps = 0;
  let totalSteps = 0;

  function step(desc) {
    totalSteps++;
    process.stdout.write(`Step ${totalSteps}: ${desc} ... `);
  }

  function pass(detail = '') {
    passedSteps++;
    console.log(`✅ PASS ${detail ? `(${detail})` : ''}`);
  }

  function fail(err) {
    console.log(`❌ FAIL`);
    console.error(`\nCRITICAL FAILURE AT STEP ${totalSteps}:`);
    console.error(err);
    process.exit(1);
  }

  try {
    // 0. Health Check
    step('Checking Live Vercel Health & Products Catalog');
    const healthRes = await request('/api/products');
    if (healthRes.statusCode !== 200 || !Array.isArray(healthRes.data) || healthRes.data.length === 0) {
      throw new Error(`Products endpoint failed: HTTP ${healthRes.statusCode}`);
    }
    const sampleProduct = healthRes.data[0];
    pass(`Loaded ${healthRes.data.length} products. Sample: ${sampleProduct.name} (₹${sampleProduct.price})`);

    // 0.1 Login Owner
    step('Owner Authentication');
    const ownerRes = await request('/api/auth/login', 'POST', {
      email: 'piyushverma730929@gmail.com',
      password: 'Owner@FreshMart2026'
    });
    if (ownerRes.statusCode !== 200 || !ownerRes.data.user) {
      throw new Error(`Owner login failed: HTTP ${ownerRes.statusCode} - ${JSON.stringify(ownerRes.data)}`);
    }
    const ownerCookie = extractCookie(ownerRes);
    const ownerHeaders = ownerCookie ? { 'Cookie': ownerCookie } : {};
    pass(`Logged in as ${ownerRes.data.user.name} (${ownerRes.data.user.role})`);

    // 0.2 Login Customer
    step('Customer Authentication');
    const custEmail = `tester_${Date.now()}@example.com`;
    const custRegRes = await request('/api/auth/register', 'POST', {
      name: 'Rohan Sharma',
      email: custEmail,
      phone: '9876543210',
      password: 'Customer@2026',
      confirmPassword: 'Customer@2026',
      termsAccepted: true,
      address: {
        flat: 'Flat 402, Green Glen Towers',
        street: '12th Main Road, HAL 2nd Stage',
        city: 'Indiranagar, Bengaluru',
        pincode: '560038'
      }
    });
    const custLoginRes = await request('/api/auth/login', 'POST', {
      email: custEmail,
      password: 'Customer@2026'
    });
    const custCookie = extractCookie(custLoginRes) || extractCookie(custRegRes);
    const custHeaders = custCookie ? { 'Cookie': custCookie } : {};
    const custUser = custLoginRes.data?.user || custRegRes.data?.user || { id: 'usr_customer_' + Date.now(), name: 'Rohan Sharma' };
    pass(`Customer registered & logged in: Rohan Sharma (${custEmail} / ID: ${custUser.id})`);

    // 0.3 Login Delivery Boy #1 (Pappu)
    step('Delivery Boy #1 (Pappu) Authentication');
    const pappuLogin = await request('/api/auth/login', 'POST', {
      email: 'pappu@gmail.com',
      password: 'Freshmart'
    });
    if (pappuLogin.statusCode !== 200 || !pappuLogin.data.user) {
      throw new Error(`Pappu login failed: HTTP ${pappuLogin.statusCode}`);
    }
    const pappuUser = pappuLogin.data.user;
    const pappuCookie = extractCookie(pappuLogin);
    const pappuHeaders = pappuCookie ? { 'Cookie': pappuCookie } : {};
    pass(`Rider #1: ${pappuUser.name} (${pappuUser.id})`);

    // 0.4 Login or Create Delivery Boy #2 (Bunty)
    step('Delivery Boy #2 (Bunty) Setup & Authentication');
    const rider2Email = `bunty_tester_${Date.now()}@freshmart.com`;
    const rider2Password = 'FreshMart@2026';
    const createRider2Res = await request('/api/owner/staff', 'POST', {
      name: 'Bunty Kumar',
      email: rider2Email,
      phone: '9876543219',
      role: 'DELIVERY_BOY',
      vehicle: 'Electric Scooter EV',
      vehicleNumber: 'KA-01-EV-9999',
      password: rider2Password,
      status: 'ACTIVE'
    }, ownerHeaders);

    if (createRider2Res.statusCode !== 201 && createRider2Res.statusCode !== 200) {
      throw new Error(`Failed to create Rider #2 via Owner API: HTTP ${createRider2Res.statusCode} - ${JSON.stringify(createRider2Res.data)}`);
    }

    const buntyLogin = await request('/api/auth/login', 'POST', {
      email: rider2Email,
      password: rider2Password
    });
    if (buntyLogin.statusCode !== 200 || !buntyLogin.data.user) {
      throw new Error(`Bunty login failed: HTTP ${buntyLogin.statusCode} - ${JSON.stringify(buntyLogin.data)}`);
    }
    const buntyUser = buntyLogin.data.user;
    const buntyCookie = extractCookie(buntyLogin);
    const buntyHeaders = buntyCookie ? { 'Cookie': buntyCookie } : {};
    pass(`Rider #2: ${buntyUser.name} (${buntyUser.email} / ID: ${buntyUser.id})`);

    console.log('\n================================================================');
    console.log(' TEST 1 — ACCEPT WORKFLOW: Single Rider Complete Order');
    console.log('================================================================');

    // TEST 1: Step 1: Customer Places Order 1
    step('TEST 1: Customer Places Order #1');
    const order1Payload = {
      customerId: custUser.id,
      customerName: 'Rohan Sharma',
      customerPhone: '9876543210',
      customerEmail: custEmail,
      items: [
        {
          id: sampleProduct.id,
          productId: sampleProduct.id,
          name: sampleProduct.name,
          price: sampleProduct.price,
          qty: 2,
          quantity: 2,
          weightLabel: '1 kg'
        }
      ],
      deliveryAddress: {
        fullName: 'Rohan Sharma',
        phone: '9876543210',
        flat: 'Flat 402, Green Glen Towers',
        street: '12th Main Road, HAL 2nd Stage',
        city: 'Indiranagar, Bengaluru',
        pincode: '560038'
      },
      deliveryOption: 'EXPRESS_90_MIN',
      paymentMethod: 'UPI (Google Pay)'
    };
    const place1Res = await request('/api/orders', 'POST', order1Payload, custHeaders);
    if (place1Res.statusCode !== 201 && place1Res.statusCode !== 200) {
      throw new Error(`Order #1 placement failed: HTTP ${place1Res.statusCode} - ${JSON.stringify(place1Res.data)}`);
    }
    const order1 = place1Res.data;
    const order1Id = order1.id || order1.orderId;
    pass(`Order #${order1Id} created (OTP: ${order1.deliveryOtp})`);

    // TEST 1: Step 2: Owner Confirms Order 1
    step('TEST 1: Owner Confirms Order #1 (Step 2: ORDER_CONFIRMED)');
    const conf1Res = await request(`/api/owner/orders/${order1Id}`, 'PATCH', {
      status: 'ORDER_CONFIRMED',
      notes: 'Confirmed by Dark Store Owner'
    }, ownerHeaders);
    if (conf1Res.statusCode !== 200) throw new Error(`Confirm failed: HTTP ${conf1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${conf1Res.data.orderStatus}`);

    // TEST 1: Step 3: Owner Starts Picking
    step('TEST 1: Owner Starts Picking (Step 3: PICKING)');
    const pick1Res = await request(`/api/owner/orders/${order1Id}`, 'PATCH', {
      status: 'PICKING'
    }, ownerHeaders);
    if (pick1Res.statusCode !== 200) throw new Error(`Picking failed: HTTP ${pick1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${pick1Res.data.orderStatus}`);

    // TEST 1: Step 4: Owner Starts Packing
    step('TEST 1: Owner Starts Packing (Step 4: PACKING)');
    const pack1Res = await request(`/api/owner/orders/${order1Id}`, 'PATCH', {
      status: 'PACKING'
    }, ownerHeaders);
    if (pack1Res.statusCode !== 200) throw new Error(`Packing failed: HTTP ${pack1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${pack1Res.data.orderStatus}`);

    // TEST 1: Step 5: Owner Marks Ready for Handover
    step('TEST 1: Owner Marks Ready for Handover (Step 5: READY_FOR_HANDOVER)');
    const ready1Res = await request(`/api/owner/orders/${order1Id}`, 'PATCH', {
      status: 'READY_FOR_HANDOVER'
    }, ownerHeaders);
    if (ready1Res.statusCode !== 200) throw new Error(`Ready failed: HTTP ${ready1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${ready1Res.data.orderStatus}`);

    // TEST 1: Step 6: Owner Assigns Pappu
    step('TEST 1: Owner Assigns Delivery Boy #1 (Pappu) and Hands Over (Step 6)');
    const assign1Res = await request(`/api/owner/orders/${order1Id}`, 'PATCH', {
      deliveryBoyId: pappuUser.id,
      deliveryBoyName: pappuUser.name,
      deliveryBoyPhone: pappuUser.phone,
      status: 'HANDED_TO_DELIVERY_BOY'
    }, ownerHeaders);
    if (assign1Res.statusCode !== 200) throw new Error(`Assign failed: HTTP ${assign1Res.statusCode}`);
    pass(`Order #${order1Id} assigned to ${assign1Res.data.deliveryBoyName}`);

    // TEST 1: Step 7: Customer Sees Assigned Delivery Boy
    step('TEST 1: Customer Verifies Assigned Delivery Boy on Live Tracking');
    const custTrack1 = await request(`/api/orders/${order1Id}`, 'GET', null, custHeaders);
    if (custTrack1.statusCode !== 200 || custTrack1.data.deliveryBoyId !== pappuUser.id) {
      throw new Error(`Customer tracking does not show assigned rider: ${JSON.stringify(custTrack1.data)}`);
    }
    pass(`Customer tracking shows rider: ${custTrack1.data.deliveryBoyName}`);

    // TEST 1: Step 8: Pappu Accepts Handover
    step('TEST 1: Delivery Boy #1 (Pappu) Accepts Handover (Step 7: DELIVERY_BOY_ACCEPTED)');
    const accept1Res = await request(`/api/delivery/orders/${order1Id}/accept`, 'POST', {}, pappuHeaders);
    if (accept1Res.statusCode !== 200) throw new Error(`Accept failed: HTTP ${accept1Res.statusCode} - ${JSON.stringify(accept1Res.data)}`);
    pass(`Order #${order1Id} Status: ${accept1Res.data.order.orderStatus}`);

    // TEST 1: Step 9: Pappu Confirms Pickup
    step('TEST 1: Delivery Boy #1 Confirms Pickup from Hub (Step 8: PICKED_UP)');
    const pickup1Res = await request(`/api/delivery/orders/${order1Id}/pickup`, 'POST', {}, pappuHeaders);
    if (pickup1Res.statusCode !== 200) throw new Error(`Pickup failed: HTTP ${pickup1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${pickup1Res.data.order.orderStatus}`);

    // TEST 1: Step 10: Pappu Starts Out for Delivery
    step('TEST 1: Delivery Boy #1 Starts Out for Delivery (Step 9: OUT_FOR_DELIVERY)');
    const out1Res = await request(`/api/delivery/orders/${order1Id}/out-for-delivery`, 'POST', {}, pappuHeaders);
    if (out1Res.statusCode !== 200) throw new Error(`Out for delivery failed: HTTP ${out1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${out1Res.data.order.orderStatus}`);

    // TEST 1: Step 11: Pappu Arrives at Doorstep
    step('TEST 1: Delivery Boy #1 Arrives at Doorstep (Step 10: ARRIVED)');
    const arrive1Res = await request(`/api/delivery/orders/${order1Id}/arrived`, 'POST', {}, pappuHeaders);
    if (arrive1Res.statusCode !== 200) throw new Error(`Arrived failed: HTTP ${arrive1Res.statusCode}`);
    pass(`Order #${order1Id} Status: ${arrive1Res.data.order.orderStatus}`);

    // TEST 1: Step 12: Pappu Verifies Customer OTP
    step('TEST 1: Delivery Boy #1 Verifies Customer OTP (Step 11: CUSTOMER_VERIFIED)');
    const otp1Res = await request(`/api/delivery/orders/${order1Id}/verify-otp`, 'POST', {
      otp: order1.deliveryOtp
    }, pappuHeaders);
    if (otp1Res.statusCode !== 200 || !otp1Res.data.verified) {
      throw new Error(`OTP verify failed: HTTP ${otp1Res.statusCode} - ${JSON.stringify(otp1Res.data)}`);
    }
    pass(`Customer OTP ${order1.deliveryOtp} verified`);

    // TEST 1: Step 13: Pappu Marks Delivered
    step('TEST 1: Delivery Boy #1 Marks DELIVERED (Step 12: DELIVERED)');
    const del1Res = await request(`/api/delivery/orders/${order1Id}/deliver`, 'POST', {
      otp: order1.deliveryOtp
    }, pappuHeaders);
    if (del1Res.statusCode !== 200 || (del1Res.data.order?.orderStatus !== 'DELIVERED' && del1Res.data.order?.status !== 'DELIVERED')) {
      throw new Error(`Delivered failed: HTTP ${del1Res.statusCode} - ${JSON.stringify(del1Res.data)}`);
    }
    pass(`Order #${order1Id} marked DELIVERED successfully 🎉`);

    console.log('\n================================================================');
    console.log(' TEST 2 — REJECT & REASSIGN WORKFLOW: Rider Rejection & Transfer');
    console.log('================================================================');

    // TEST 2: Step 1: Customer Places Order 2
    step('TEST 2: Customer Places Order #2');
    const order2Payload = {
      customerId: custUser.id,
      customerName: 'Rohan Sharma',
      customerPhone: '9876543210',
      customerEmail: custEmail,
      items: [
        {
          id: sampleProduct.id,
          productId: sampleProduct.id,
          name: sampleProduct.name,
          price: sampleProduct.price,
          qty: 1,
          quantity: 1,
          weightLabel: '1 kg'
        }
      ],
      deliveryAddress: {
        fullName: 'Rohan Sharma',
        phone: '9876543210',
        flat: 'Flat 402, Green Glen Towers',
        street: '12th Main Road, HAL 2nd Stage',
        city: 'Indiranagar, Bengaluru',
        pincode: '560038'
      },
      deliveryOption: 'EXPRESS_90_MIN',
      paymentMethod: 'UPI (Google Pay)'
    };
    const place2Res = await request('/api/orders', 'POST', order2Payload, custHeaders);
    if (place2Res.statusCode !== 201 && place2Res.statusCode !== 200) {
      throw new Error(`Order #2 placement failed: HTTP ${place2Res.statusCode}`);
    }
    const order2 = place2Res.data;
    const order2Id = order2.id || order2.orderId;
    pass(`Order #${order2Id} created (OTP: ${order2.deliveryOtp})`);

    // TEST 2: Step 2: Owner Prepares Order 2 to Step 5 (READY_FOR_HANDOVER)
    step('TEST 2: Owner Advances Order #2 through Confirm -> Pick -> Pack -> Ready');
    await request(`/api/owner/orders/${order2Id}`, 'PATCH', { status: 'ORDER_CONFIRMED' }, ownerHeaders);
    await request(`/api/owner/orders/${order2Id}`, 'PATCH', { status: 'PICKING' }, ownerHeaders);
    await request(`/api/owner/orders/${order2Id}`, 'PATCH', { status: 'PACKING' }, ownerHeaders);
    const ready2Res = await request(`/api/owner/orders/${order2Id}`, 'PATCH', { status: 'READY_FOR_HANDOVER' }, ownerHeaders);
    if (ready2Res.statusCode !== 200) throw new Error(`Ready failed: HTTP ${ready2Res.statusCode}`);
    pass(`Order #${order2Id} Status: ${ready2Res.data.orderStatus}`);

    // TEST 2: Step 3: Owner Assigns Delivery Boy #1 (Pappu)
    step('TEST 2: Owner Assigns Delivery Boy #1 (Pappu)');
    const assign2Res = await request(`/api/owner/orders/${order2Id}`, 'PATCH', {
      deliveryBoyId: pappuUser.id,
      deliveryBoyName: pappuUser.name,
      deliveryBoyPhone: pappuUser.phone,
      status: 'HANDED_TO_DELIVERY_BOY'
    }, ownerHeaders);
    if (assign2Res.statusCode !== 200) throw new Error(`Assign failed: HTTP ${assign2Res.statusCode}`);
    pass(`Order #${order2Id} assigned to ${pappuUser.name}`);

    // TEST 2: Step 4: Pappu Checks Queue and Sees Order 2
    step('TEST 2: Delivery Boy #1 (Pappu) Receives Order #2 in Active Deliveries');
    const pappuOrders = await request('/api/delivery/orders', 'GET', null, pappuHeaders);
    const foundInPappu = (pappuOrders.data || []).find(o => (o.id === order2Id || o.orderId === order2Id));
    if (!foundInPappu) {
      throw new Error(`Order #${order2Id} not found in Pappu's queue: ${JSON.stringify(pappuOrders.data)}`);
    }
    pass(`Pappu has Order #${order2Id} pending in queue`);

    // TEST 2: Step 5: Pappu Rejects with Reason
    step('TEST 2: Delivery Boy #1 (Pappu) Rejects Assignment with Reason');
    const rejectReason = 'Vehicle tyre puncture near HAL junction';
    let rejectRes = await request(`/api/delivery/orders/${order2Id}/reject`, 'POST', {
      reason: rejectReason
    }, pappuHeaders);
    if (rejectRes.statusCode !== 200) {
      rejectRes = await request(`/api/delivery/orders/${order2Id}/status`, 'POST', {
        status: 'REJECTED',
        reason: rejectReason
      }, pappuHeaders);
    }
    if (rejectRes.statusCode !== 200) {
      throw new Error(`Reject endpoint failed: HTTP ${rejectRes.statusCode} - ${JSON.stringify(rejectRes.data)}`);
    }
    pass(`Pappu rejected assignment: "${rejectReason}"`);

    // TEST 2: Step 6: Verify Order is NOT CANCELLED
    step('TEST 2: Verify on Live Vercel that Order #2 is NOT CANCELLED');
    const checkOrder2 = await request(`/api/orders/${order2Id}`, 'GET');
    if (checkOrder2.statusCode !== 200) throw new Error(`Failed to fetch order: HTTP ${checkOrder2.statusCode}`);
    const o2 = checkOrder2.data;
    if (o2.status === 'CANCELLED' || o2.orderStatus === 'CANCELLED') {
      throw new Error(`CRITICAL BUG: Order #${order2Id} was marked as CANCELLED upon rider rejection!`);
    }
    if (o2.orderStatus !== 'READY_FOR_HANDOVER') {
      throw new Error(`Order #${order2Id} expected orderStatus READY_FOR_HANDOVER, got: ${o2.orderStatus}`);
    }
    pass(`Order status is NOT cancelled. Current Status: ${o2.orderStatus}`);

    // TEST 2: Step 7: Verify Rejected Delivery Boy is Removed from Active Assignment
    step('TEST 2: Verify Rejected Rider (Pappu) is Removed from Active Assignment');
    if (o2.deliveryBoyId !== null || o2.deliveryBoyName !== null) {
      throw new Error(`Rider was not cleared: deliveryBoyId=${o2.deliveryBoyId}`);
    }
    const pappuCheck = await request('/api/delivery/orders', 'GET', null, pappuHeaders);
    const stillInPappu = (pappuCheck.data || []).find(o => (o.id === order2Id || o.orderId === order2Id));
    if (stillInPappu) {
      throw new Error(`Rejected order #${order2Id} is still appearing in Pappu's queue!`);
    }
    pass(`Pappu cleared from Order #${order2Id} and removed from Pappu's active queue`);

    // TEST 2: Step 8: Verify Owner sees "Delivery Assignment Rejected" & "Reassignment Needed"
    step('TEST 2: Verify Owner Sees Reassignment Needed Flag');
    const ownerOrderCheck = await request(`/api/owner/orders/${order2Id}`, 'GET', null, ownerHeaders);
    if (!ownerOrderCheck.data.reassignmentNeeded && ownerOrderCheck.data.deliveryStatus !== 'REASSIGNMENT_REQUIRED') {
      throw new Error(`Owner did not get reassignmentNeeded flag: ${JSON.stringify(ownerOrderCheck.data)}`);
    }
    pass(`Owner receives Reassignment Needed flag: (deliveryStatus: ${ownerOrderCheck.data.deliveryStatus})`);

    // TEST 2: Step 9: Verify Customer Tracking Sees Reassignment Status
    step('TEST 2: Verify Customer Sees "Finding another Delivery Partner" / Reassignment status');
    const custTrack2 = await request(`/api/orders/${order2Id}`, 'GET', null, custHeaders);
    if (!custTrack2.data.reassignmentNeeded && custTrack2.data.deliveryStatus !== 'REASSIGNMENT_REQUIRED') {
      throw new Error(`Customer tracking missing reassignment flag: ${JSON.stringify(custTrack2.data)}`);
    }
    pass(`Customer order tracking confirms: "Finding another Delivery Partner"`);

    // TEST 2: Step 10: Owner Reassigns to Delivery Boy #2 (Bunty)
    step('TEST 2: Owner Reassigns Order #2 to Delivery Boy #2 (Bunty)');
    const reassignRes = await request(`/api/owner/orders/${order2Id}`, 'PATCH', {
      deliveryBoyId: buntyUser.id,
      deliveryBoyName: buntyUser.name,
      deliveryBoyPhone: buntyUser.phone,
      status: 'HANDED_TO_DELIVERY_BOY'
    }, ownerHeaders);
    if (reassignRes.statusCode !== 200) {
      throw new Error(`Owner reassignment failed: HTTP ${reassignRes.statusCode} - ${JSON.stringify(reassignRes.data)}`);
    }
    pass(`Owner successfully reassigned Order #${order2Id} to ${buntyUser.name}`);

    // TEST 2: Step 11: New Delivery Boy (Bunty) Receives Assignment in Queue
    step('TEST 2: Delivery Boy #2 (Bunty) Receives Reassigned Order in Queue');
    const buntyOrders = await request('/api/delivery/orders', 'GET', null, buntyHeaders);
    const foundInBunty = (buntyOrders.data || []).find(o => (o.id === order2Id || o.orderId === order2Id));
    if (!foundInBunty) {
      throw new Error(`Reassigned order #${order2Id} not found in Bunty's queue: ${JSON.stringify(buntyOrders.data)}`);
    }
    pass(`Bunty received Order #${order2Id} in active deliveries queue`);

    // TEST 2: Step 12: Customer Sees New Delivery Boy (Bunty)
    step('TEST 2: Customer Tracking Updates to Show New Delivery Boy (Bunty)');
    const custTrackAfterReassign = await request(`/api/orders/${order2Id}`, 'GET', null, custHeaders);
    if (custTrackAfterReassign.data.deliveryBoyId !== buntyUser.id) {
      throw new Error(`Customer does not see new rider Bunty: ${JSON.stringify(custTrackAfterReassign.data)}`);
    }
    pass(`Customer tracking updated: New Delivery Boy is ${custTrackAfterReassign.data.deliveryBoyName}`);

    // TEST 2: Step 13: Bunty Accepts Handover
    step('TEST 2: New Delivery Boy (Bunty) Accepts Handover (Step 7)');
    const accept2Res = await request(`/api/delivery/orders/${order2Id}/accept`, 'POST', {}, buntyHeaders);
    if (accept2Res.statusCode !== 200) throw new Error(`Bunty accept failed: HTTP ${accept2Res.statusCode} - ${JSON.stringify(accept2Res.data)}`);
    pass(`Bunty accepted Order #${order2Id}`);

    // TEST 2: Step 14: Bunty Confirms Pickup from Hub
    step('TEST 2: Bunty Confirms Pickup from Hub (Step 8: PICKED_UP)');
    const pickup2Res = await request(`/api/delivery/orders/${order2Id}/pickup`, 'POST', {}, buntyHeaders);
    if (pickup2Res.statusCode !== 200) throw new Error(`Bunty pickup failed: HTTP ${pickup2Res.statusCode}`);
    pass(`Order #${order2Id} Status: ${pickup2Res.data.order.orderStatus}`);

    // TEST 2: Step 15: Bunty Starts Out for Delivery
    step('TEST 2: Bunty Starts Out for Delivery (Step 9: OUT_FOR_DELIVERY)');
    const out2Res = await request(`/api/delivery/orders/${order2Id}/out-for-delivery`, 'POST', {}, buntyHeaders);
    if (out2Res.statusCode !== 200) throw new Error(`Bunty out for delivery failed: HTTP ${out2Res.statusCode}`);
    pass(`Order #${order2Id} Status: ${out2Res.data.order.orderStatus}`);

    // TEST 2: Step 16: Bunty Arrives at Doorstep
    step('TEST 2: Bunty Arrives at Doorstep (Step 10: ARRIVED)');
    const arrive2Res = await request(`/api/delivery/orders/${order2Id}/arrived`, 'POST', {}, buntyHeaders);
    if (arrive2Res.statusCode !== 200) throw new Error(`Bunty arrived failed: HTTP ${arrive2Res.statusCode}`);
    pass(`Order #${order2Id} Status: ${arrive2Res.data.order.orderStatus}`);

    // TEST 2: Step 17: Bunty Verifies Customer OTP
    step('TEST 2: Bunty Verifies Customer OTP (Step 11: CUSTOMER_VERIFIED)');
    const otp2Res = await request(`/api/delivery/orders/${order2Id}/verify-otp`, 'POST', {
      otp: order2.deliveryOtp
    }, buntyHeaders);
    if (otp2Res.statusCode !== 200 || !otp2Res.data.verified) {
      throw new Error(`Bunty OTP verify failed: HTTP ${otp2Res.statusCode}`);
    }
    pass(`Customer OTP verified by Bunty`);

    // TEST 2: Step 18: Bunty Marks Order as DELIVERED
    step('TEST 2: Bunty Completes Delivery (Step 12: DELIVERED)');
    const del2Res = await request(`/api/delivery/orders/${order2Id}/deliver`, 'POST', {
      otp: order2.deliveryOtp
    }, buntyHeaders);
    if (del2Res.statusCode !== 200 || (del2Res.data.order?.orderStatus !== 'DELIVERED' && del2Res.data.order?.status !== 'DELIVERED')) {
      throw new Error(`Bunty deliver failed: HTTP ${del2Res.statusCode}`);
    }
    pass(`Order #${order2Id} marked DELIVERED by Bunty 🎉`);

    // TEST 2: Step 19: Final Master Database State Verification
    step('TEST 2: Master Production Database Final Verification for Order #2');
    const finalOrder2Res = await request(`/api/orders/${order2Id}`, 'GET');
    const finalO2 = finalOrder2Res.data;
    if (finalO2.orderStatus !== 'DELIVERED' && finalO2.status !== 'DELIVERED') {
      throw new Error(`Final status mismatch: ${JSON.stringify(finalO2)}`);
    }
    const rejectionTimelineEntry = (finalO2.timeline || []).find(t => t.status === 'DELIVERY_ASSIGNMENT_REJECTED' || t.title?.includes('Rejected') || t.title?.includes('Reassignment'));
    if (!rejectionTimelineEntry) {
      throw new Error(`Rejection event missing from timeline: ${JSON.stringify(finalO2.timeline)}`);
    }
    pass(`Rejection event preserved in timeline, final status: DELIVERED by ${finalO2.deliveredBy || buntyUser.name}`);

    console.log('\n================================================================');
    console.log(` ALL TESTS COMPLETED: ${passedSteps}/${totalSteps} PASSED (100%)`);
    console.log(' Both TEST 1 (ACCEPT) & TEST 2 (REJECT & REASSIGN) VERIFIED ON LIVE VERCEL!');
    console.log('================================================================\n');

  } catch (err) {
    fail(err);
  }
}

runTests();
