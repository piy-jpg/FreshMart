const https = require('https');
const assert = require('assert');

function callApi(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...headers
    };
    if (body) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const req = https.request({
      hostname: 'freshmart-ten-vert.vercel.app',
      path: path,
      method: method,
      headers: defaultHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('🧪 Testing Complete Owner Edit -> Logout -> Unauthenticated Guest Catalog -> Re-Login Lifecycle on Live Vercel...\n');

  // STEP 1: Login as Owner
  console.log('--- Step 1: Owner Login ---');
  const loginRes = await callApi('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  assert.strictEqual(loginRes.statusCode, 200, 'Login must succeed');
  const token = loginRes.data.session?.token || loginRes.data.token;
  assert(token, 'Session token must be present');
  console.log('  ✅ Owner logged in successfully as:', loginRes.data.user.name);

  // STEP 2: Change product price ₹100 -> ₹200
  console.log('\n--- Step 2: Owner edits product price to ₹200 ---');
  const updateRes = await callApi('PUT', '/api/owner/products/prod_tomato', {
    id: 'prod_tomato',
    name: 'Fresh Tomato',
    price: 200,
    sellingPrice: 200,
    mrp: 260,
    stock: 250,
    category: 'Vegetables'
  }, { 'Authorization': 'Bearer ' + token });
  assert.strictEqual(updateRes.statusCode, 200, 'Product update must succeed');
  assert.strictEqual(updateRes.data.success, true, 'success flag must be true');
  assert.strictEqual(updateRes.data.product.price, 200, 'Database price must be ₹200');
  console.log('  ✅ Database record price verified:', updateRes.data.product.price);

  // STEP 3: Logout Owner
  console.log('\n--- Step 3: Owner Logs Out ---');
  const logoutRes = await callApi('POST', '/api/auth/logout', null, { 'Authorization': 'Bearer ' + token });
  assert.strictEqual(logoutRes.statusCode, 200, 'Logout must succeed');
  console.log('  ✅ Owner logged out successfully.');

  // STEP 4: Unauthenticated Guest Client opens website and refreshes 10 times
  console.log('\n--- Step 4: Unauthenticated Guest Client reads Storefront Product API (10 consecutive reads) ---');
  for (let i = 1; i <= 10; i++) {
    const guestRes = await callApi('GET', `/api/products?_t=${Date.now()}_${i}`);
    assert.strictEqual(guestRes.statusCode, 200, `Guest read ${i} must succeed`);
    const tomato = guestRes.data.find(p => p.id === 'prod_tomato' || p.sku === 'SJH-VEG-TOM-01');
    assert(tomato, `Guest read ${i}: Tomato must exist in catalog`);
    console.log(`  Guest Read #${i}: Price = ₹${tomato.price} | MRP = ₹${tomato.mrp} | Status = ${tomato.status} => ${tomato.price === 200 ? '✅ 100% PERSISTED' : '❌ STALE'}`);
    assert.strictEqual(tomato.price, 200, `Guest read ${i}: Price must be ₹200`);
  }

  // STEP 5: Login as Owner again
  console.log('\n--- Step 5: Owner Logs in Again ---');
  const reLoginRes = await callApi('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  assert.strictEqual(reLoginRes.statusCode, 200, 'Re-login must succeed');
  const reToken = reLoginRes.data.session?.token || reLoginRes.data.token;
  console.log('  ✅ Owner re-authenticated.');

  // STEP 6: Owner fetches catalog -> Product must still show ₹200
  console.log('\n--- Step 6: Owner fetches Catalog from Database ---');
  const ownerProdsRes = await callApi('GET', `/api/owner/products?_t=${Date.now()}`, null, { 'Authorization': 'Bearer ' + reToken });
  assert.strictEqual(ownerProdsRes.statusCode, 200, 'Owner products fetch must succeed');
  const ownerTomato = ownerProdsRes.data.find(p => p.id === 'prod_tomato' || p.sku === 'SJH-VEG-TOM-01');
  assert(ownerTomato, 'Tomato must exist in Owner catalog');
  console.log('  ✅ Owner Catalog Tomato Price:', ownerTomato.price);
  assert.strictEqual(ownerTomato.price, 200, 'Owner Catalog price must strictly be ₹200');

  console.log('\n======================================================================');
  console.log('🎉 ALL PRODUCT LIFECYCLE & LOGOUT PERSISTENCE TESTS PASSED 100%!');
  console.log('======================================================================\n');
})();
