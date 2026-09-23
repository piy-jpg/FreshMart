const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json || data
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

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
  const match = cookieStr.match(/(?:sjh_session|sabjihub_session)=([^;]+)/);
  return match ? match[1] : null;
}

async function runCartIsolationTests() {
  console.log('🧪 Starting Fresh Mart Basket / Cart Data Isolation Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const testTime = Date.now();
    const userA_email = `customer_a_${testTime}@freshmart.test`;
    const userB_email = `customer_b_${testTime}@freshmart.test`;
    const password = 'Password@123';

    // Step 1: Register Customer A
    console.log('1️⃣ Registering Customer A and checking initial cart...');
    const regResA = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Customer A', email: userA_email, phone: '9876543210', password, confirmPassword: password, termsAccepted: true });
    
    assert(regResA.statusCode === 201 && regResA.data.success, 'Customer A registered successfully (201 Created)');

    // Verify Customer A email using the db record token
    const dbData = require('../database');
    const userA = dbData.getAll('users').find(u => u.email === userA_email);
    assert(!!userA && !!userA.verificationToken, 'Customer A verification token generated');

    const verifyResA = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/verify-email',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { token: userA.verificationToken });

    assert(verifyResA.statusCode === 200 && verifyResA.data.success, 'Customer A email verified and logged in');
    const cookieA = extractCookie(verifyResA.headers);
    assert(!!cookieA, 'Customer A received session cookie');

    // Check Customer A initial cart (MUST BE EMPTY)
    const cartResA1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${cookieA}` }
    });
    assert(cartResA1.statusCode === 200, 'Customer A GET /api/cart returned 200');
    assert(Object.keys(cartResA1.data.items || {}).length === 0, 'New Customer A starts with a completely EMPTY cart (no demo items!)');

    // Step 2: Customer A adds items to basket
    console.log('\n2️⃣ Customer A adds 2 items (Pahadi Potato & Fresh Tomato)...');
    const itemsA = {
      'potato-0': { productId: 'potato', name: 'Pahadi Potato', price: 35, qty: 2 },
      'tomato-1': { productId: 'tomato', name: 'Fresh Tomato', price: 40, qty: 1 }
    };
    const saveCartA = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `sjh_session=${cookieA}` }
    }, { items: itemsA });
    assert(saveCartA.statusCode === 200 && saveCartA.data.success, 'Customer A successfully saved cart to server');

    // Verify Customer A cart on server
    const checkCartA = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${cookieA}` }
    });
    assert(Object.keys(checkCartA.data.items || {}).length === 2, 'Customer A cart contains exactly 2 items');
    assert(checkCartA.data.items['potato-0'].qty === 2, 'Customer A potato qty is 2');

    // Step 3: Register Customer B
    console.log('\n3️⃣ Registering Customer B and verifying isolation...');
    const regResB = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { name: 'Customer B', email: userB_email, phone: '9876543211', password, confirmPassword: password, termsAccepted: true });
    
    assert(regResB.statusCode === 201 && regResB.data.success, 'Customer B registered successfully');
    
    // Verify Customer B email
    dbData.load();
    const userB = dbData.getAll('users').find(u => u.email === userB_email);
    assert(!!userB && !!userB.verificationToken, 'Customer B verification token generated');

    const verifyResB = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/verify-email',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { token: userB.verificationToken });

    assert(verifyResB.statusCode === 200 && verifyResB.data.success, 'Customer B email verified and logged in');
    const cookieB = extractCookie(verifyResB.headers);

    // Customer B Cart MUST BE EMPTY (Must NEVER see Customer A's items!)
    const cartResB1 = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${cookieB}` }
    });
    assert(Object.keys(cartResB1.data.items || {}).length === 0, 'Customer B cart is EMPTY and completely ISOLATED from Customer A');

    // Step 4: Customer B adds 1 different item (Nashik Onion)
    console.log('\n4️⃣ Customer B adds Nashik Onion to basket...');
    const itemsB = {
      'onion-0': { productId: 'onion', name: 'Nashik Onion', price: 28, qty: 3 }
    };
    await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `sjh_session=${cookieB}` }
    }, { items: itemsB });

    const checkCartB = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${cookieB}` }
    });
    assert(Object.keys(checkCartB.data.items || {}).length === 1, 'Customer B cart has 1 item');
    assert(checkCartB.data.items['onion-0'] !== undefined, 'Customer B cart has onion-0');
    assert(checkCartB.data.items['potato-0'] === undefined, 'Customer B does NOT have potato-0');

    // Step 5: Verify Customer A cart is still intact and unchanged
    console.log('\n5️⃣ Re-verifying Customer A cart is untouched...');
    const recheckCartA = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${cookieA}` }
    });
    assert(Object.keys(recheckCartA.data.items || {}).length === 2, 'Customer A cart still has 2 items');
    assert(recheckCartA.data.items['potato-0'] !== undefined, 'Customer A still has potato-0');
    assert(recheckCartA.data.items['onion-0'] === undefined, 'Customer A does NOT have Customer B onion-0');

    // Step 6: Unauthenticated / Guest Cart isolation
    console.log('\n6️⃣ Checking Unauthenticated / Guest Cart...');
    const guestCartRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET'
    });
    assert(Object.keys(guestCartRes.data.items || {}).length === 0, 'Guest cart defaults to empty {} without session');

    // Step 7: Owner login cart isolation
    console.log('\n7️⃣ Checking Owner account cart isolation...');
    let ownerLogin = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'piyushverma730929@gmail.com', password: 'password123' });

    if (ownerLogin.statusCode !== 200 || !ownerLogin.data.success) {
      ownerLogin = await makeRequest({
        hostname: '127.0.0.1',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { email: 'owner@freshmart.local', password: 'password123' });
    }

    assert(ownerLogin.statusCode === 200 && ownerLogin.data.success, 'Owner logged in successfully');
    const ownerCookie = extractCookie(ownerLogin.headers);
    const ownerCartRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${ownerCookie}` }
    });
    assert(Object.keys(ownerCartRes.data.items || {}).length === 0, 'Owner account has isolated empty cart (no customer cart cross-contamination)');

    // Step 8: Delivery Boy account cart isolation
    console.log('\n8️⃣ Checking Delivery Boy account cart isolation...');
    const dbLogin = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'pappu@gmail.com', password: 'Freshmart' });

    assert(dbLogin.statusCode === 200 && dbLogin.data.success, 'Delivery Boy logged in successfully');
    const dbCookie = extractCookie(dbLogin.headers);
    const dbCartRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 8080,
      path: '/api/cart',
      method: 'GET',
      headers: { Cookie: `sjh_session=${dbCookie}` }
    });
    assert(Object.keys(dbCartRes.data.items || {}).length === 0, 'Delivery Boy account has isolated empty cart');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n==================================================`);
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);

  if (failed > 0) process.exit(1);
}

runCartIsolationTests();
