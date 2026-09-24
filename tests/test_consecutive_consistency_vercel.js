const https = require('https');
const assert = require('assert');

function callApi(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Cache-Control': 'no-cache, no-store',
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
  console.log('🏛️ Starting 10-Consecutive-Refresh Consistency Diagnostic Test on Live Vercel...\n');

  // Step 1: Login Owner
  const loginRes = await callApi('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  assert.strictEqual(loginRes.statusCode, 200, 'Owner login must succeed');
  const token = loginRes.data.session?.token || loginRes.data.token;
  assert(token, 'Valid session token required');
  console.log('  1. Owner authenticated successfully.');

  // Step 2: Set Tomato Price from ₹100 to ₹200
  console.log('\n--- Step 2: Owner updates Tomato Price: ₹100 -> ₹200 ---');
  const updateRes1 = await callApi('PUT', '/api/owner/products/prod_tomato', {
    id: 'prod_tomato',
    name: 'Fresh Tomato',
    price: 200,
    sellingPrice: 200,
    mrp: 260,
    stock: 250,
    category: 'Vegetables'
  }, { 'Authorization': 'Bearer ' + token });
  assert.strictEqual(updateRes1.statusCode, 200, 'Update must return 200');
  assert.strictEqual(updateRes1.data.product.price, 200, 'Returned product price must be ₹200');
  console.log('  ✅ Database record price updated to: ₹' + updateRes1.data.product.price);

  // Step 3: Run 10 Consecutive Refreshes on Customer Product API
  console.log('\n--- Step 3: Running 10 Consecutive Refreshes on Customer Storefront API (Target: ₹200) ---');
  for (let i = 1; i <= 10; i++) {
    const res = await callApi('GET', `/api/products?_t=${Date.now()}_${i}`);
    assert.strictEqual(res.statusCode, 200, `Request ${i} must succeed`);
    const tomato = (Array.isArray(res.data) ? res.data : []).find(p => p.id === 'prod_tomato' || p.sku === 'SJH-VEG-TOM-01');
    assert(tomato, `Request ${i}: Tomato must be present in catalog`);
    console.log(`  Refresh #${i}: HTTP ${res.statusCode} | Price: ₹${tomato.price} | MRP: ₹${tomato.mrp} | Stock: ${tomato.stock} => ${tomato.price === 200 ? '✅ CONSISTENT' : '❌ FAILED'}`);
    assert.strictEqual(tomato.price, 200, `Request ${i}: Price must strictly be ₹200 without flapping`);
  }

  // Step 4: Owner updates Tomato Price from ₹200 to ₹250
  console.log('\n--- Step 4: Owner updates Tomato Price: ₹200 -> ₹250 ---');
  const updateRes2 = await callApi('PUT', '/api/owner/products/prod_tomato', {
    id: 'prod_tomato',
    name: 'Fresh Tomato',
    price: 250,
    sellingPrice: 250,
    mrp: 299,
    stock: 240,
    category: 'Vegetables'
  }, { 'Authorization': 'Bearer ' + token });
  assert.strictEqual(updateRes2.statusCode, 200, 'Update must return 200');
  assert.strictEqual(updateRes2.data.product.price, 250, 'Returned product price must be ₹250');
  console.log('  ✅ Database record price updated to: ₹' + updateRes2.data.product.price);

  // Step 5: Run 10 Consecutive Refreshes on Customer Product API for ₹250
  console.log('\n--- Step 5: Running 10 Consecutive Refreshes on Customer Storefront API (Target: ₹250) ---');
  for (let i = 1; i <= 10; i++) {
    const res = await callApi('GET', `/api/products?_t=${Date.now()}_${i}`);
    assert.strictEqual(res.statusCode, 200, `Request ${i} must succeed`);
    const tomato = (Array.isArray(res.data) ? res.data : []).find(p => p.id === 'prod_tomato' || p.sku === 'SJH-VEG-TOM-01');
    assert(tomato, `Request ${i}: Tomato must be present in catalog`);
    console.log(`  Refresh #${i}: HTTP ${res.statusCode} | Price: ₹${tomato.price} | MRP: ₹${tomato.mrp} | Stock: ${tomato.stock} => ${tomato.price === 250 ? '✅ CONSISTENT' : '❌ FAILED'}`);
    assert.strictEqual(tomato.price, 250, `Request ${i}: Price must strictly be ₹250 without flapping`);
  }

  console.log('\n================================================================');
  console.log('🎉 100% CONSISTENCY VERIFIED ACROSS 20 CONSECUTIVE READS ON VERCEL!');
  console.log('================================================================\n');
})();
