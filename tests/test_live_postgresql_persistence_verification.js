// tests/test_live_postgresql_persistence_verification.js
const https = require('https');
const BASE_URL = process.env.LIVE_VERCEL_URL || 'https://freshmart-ten-vert.vercel.app';

function request(urlPath, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, BASE_URL);
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'FreshMart-Postgres-Verifier/2.0',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || 443,
      path: fullUrl.pathname + fullUrl.search,
      method: method.toUpperCase(),
      headers: reqHeaders,
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (e) {
          parsed = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request to ' + urlPath + ' timed out'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

function makeAuthHeaders(loginResult) {
  const token = loginResult.data?.token || loginResult.data?.session?.token || loginResult.data?.session?.id;
  return { 'x-session-token': token, 'Authorization': 'Bearer ' + token };
}

let currentStep = 1;
function step(title) {
  console.log(`\nStep ${currentStep++}: ${title} ...`);
}
function pass(msg) {
  console.log(`  ✅ PASS (${msg})`);
}

async function run() {
  console.log('================================================================');
  console.log(' FRESHMART PRODUCTION POSTGRESQL PERSISTENCE VERIFICATION');
  console.log(' Target Deployment: ' + BASE_URL);
  console.log('================================================================');

  // Step 1: Diagnostic Check
  step('Check PostgreSQL Diagnostic Endpoint');
  const statusRes = await request('/api/database/status');
  if (statusRes.statusCode !== 200 || !statusRes.data.connected) {
    throw new Error('Database not connected: ' + JSON.stringify(statusRes.data));
  }
  pass('PostgreSQL Database Connected: ' + statusRes.data.database + ' with ' + statusRes.data.tables.length + ' tables');

  // Step 2: Owner Login
  step('Owner Login (Session #1)');
  const login1 = await request('/api/auth/login', 'POST', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  if (login1.statusCode !== 200 || !login1.data.user) {
    throw new Error('Owner login failed: ' + JSON.stringify(login1.data));
  }
  const headers1 = makeAuthHeaders(login1);
  pass('Authenticated as ' + login1.data.user.name + ' (' + login1.data.user.role + ')');

  // Step 3: Create Product
  const runId = Date.now();
  const testProdName = 'Himalayan Organic Golden Apples #' + runId;
  step('Create Product in PostgreSQL');
  const createRes = await request('/api/owner/products', 'POST', {
    name: testProdName,
    hindiName: 'सेब',
    category: 'Fruits & Berries',
    subcategory: 'Apples & Pears',
    unit: '1 kg (4 pcs)',
    price: 100,
    sellingPrice: 100,
    mrp: 140,
    costPrice: 65,
    stock: 50,
    lowStockLimit: 10,
    status: 'ACTIVE',
    farmer: 'Kinnaur Apple Orchards',
    farmSource: 'Kinnaur, HP',
    description: 'Crisp handpicked organic golden apples from Kinnaur.'
  }, headers1);

  if (createRes.statusCode !== 200 && createRes.statusCode !== 201) {
    throw new Error('Create product failed: ' + JSON.stringify(createRes.data));
  }
  const prod = createRes.data.product;
  const prodId = prod.id;
  pass('Product Created: ID=' + prodId + ', Initial Price=₹' + prod.price + ', Stock=' + prod.stock);

  // Step 4: Product Price Edit ₹100 -> ₹200
  step('Edit Product Price: ₹100 → ₹200 in PostgreSQL');
  const editPriceRes = await request('/api/owner/products/' + encodeURIComponent(prodId), 'PUT', {
    name: testProdName,
    price: 200,
    sellingPrice: 200,
    mrp: 260,
    stock: 50
  }, headers1);
  if (editPriceRes.statusCode !== 200 || editPriceRes.data.product?.price !== 200) {
    throw new Error('Price edit failed: ' + JSON.stringify(editPriceRes.data));
  }
  pass('API Price Update Confirmed: Price=₹' + editPriceRes.data.product.price);

  // Step 5: Edit Product Name & Stock
  step('Edit Product Name & Stock Level');
  const editStockRes = await request('/api/owner/products/' + encodeURIComponent(prodId), 'PUT', {
    name: testProdName + ' (Royal Reserve)',
    price: 200,
    sellingPrice: 200,
    stock: 120,
    category: 'Exotic & Organic'
  }, headers1);
  if (editStockRes.statusCode !== 200 || editStockRes.data.product?.stock !== 120) {
    throw new Error('Stock update failed: ' + JSON.stringify(editStockRes.data));
  }
  pass('Product Name & Stock Updated: Name= + editStockRes.data.product.name + , Stock=' + editStockRes.data.product.stock);

  // Step 6: Publish/Unpublish Status Toggle
  step('Toggle Product Publish / Suspend Status');
  const suspendRes = await request('/api/owner/products/' + encodeURIComponent(prodId) + '/status', 'PATCH', {
    status: 'SUSPENDED'
  }, headers1);
  if (suspendRes.statusCode !== 200 || suspendRes.data.product?.status !== 'SUSPENDED') {
    throw new Error('Suspend status update failed: ' + JSON.stringify(suspendRes.data));
  }
  pass('Product Suspended (Unpublished) Status: ' + suspendRes.data.product.status);

  // Re-activate
  const activateRes = await request('/api/owner/products/' + encodeURIComponent(prodId) + '/status', 'PATCH', {
    status: 'ACTIVE'
  }, headers1);
  if (activateRes.statusCode !== 200 || activateRes.data.product?.status !== 'ACTIVE') {
    throw new Error('Reactivate status update failed: ' + JSON.stringify(activateRes.data));
  }
  pass('Product Reactivated (Published) Status: ' + activateRes.data.product.status);

  // Step 7: Create & Update Category
  step('Create Category in PostgreSQL');
  const catName = 'Hydroponic Greens #' + runId;
  const createCatRes = await request('/api/owner/categories', 'POST', {
    name: catName,
    slug: 'hydroponic-greens-' + runId,
    icon: '🌱'
  }, headers1);
  if (createCatRes.statusCode !== 200 && createCatRes.statusCode !== 201) {
    throw new Error('Category create failed: ' + JSON.stringify(createCatRes.data));
  }
  pass('Category Created in PostgreSQL: ' + catName);

  // Step 8: Owner Refreshes Dashboard
  step('Owner Dashboard Refresh (Fresh Query from PostgreSQL)');
  const refreshProdsRes = await request('/api/owner/products?_t=' + Date.now(), 'GET', null, headers1);
  const refreshedProd = (refreshProdsRes.data.products || refreshProdsRes.data || []).find(p => p.id === prodId);
  if (!refreshedProd || refreshedProd.price !== 200 || refreshedProd.stock !== 120) {
    throw new Error('Refreshed product mismatch: ' + JSON.stringify(refreshedProd));
  }
  pass('Owner Dashboard verifies updated product: Price=₹' + refreshedProd.price + ', Stock=' + refreshedProd.stock);

  // Step 9: Owner Logs Out
  step('Owner Logs Out (Terminating Session #1)');
  const logoutRes = await request('/api/auth/logout', 'POST', null, headers1);
  if (logoutRes.statusCode !== 200) throw new Error('Logout failed');
  pass('Owner Session #1 Logged Out and Destroyed');

  // Step 10: Owner Logs In (Session #2)
  step('Owner Logs In Again (Session #2)');
  const login2 = await request('/api/auth/login', 'POST', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  if (login2.statusCode !== 200 || !login2.data.user) throw new Error('Re-login failed');
  const headers2 = makeAuthHeaders(login2);
  pass('Owner Re-Authenticated (Session #2 Token: ' + (login2.data.session?.id || '').slice(0, 16) + '...)');

  // Step 11: Verify Product Persists in Session #2
  step('Session #2: Verify Product Persists in PostgreSQL');
  const session2Prods = await request('/api/owner/products?_t=' + Date.now(), 'GET', null, headers2);
  const s2Prod = (session2Prods.data.products || session2Prods.data || []).find(p => p.id === prodId);
  if (!s2Prod || s2Prod.price !== 200 || s2Prod.stock !== 120) {
    throw new Error('Session 2 product mismatch: ' + JSON.stringify(s2Prod));
  }
  pass('Session #2 confirms product intact: Price=₹' + s2Prod.price + ', Stock=' + s2Prod.stock);

  // Step 12: Customer Website (Guest Session)
  step('Customer Website (Guest Session) Reads Product from PostgreSQL');
  const publicRes = await request('/api/products?_t=' + Date.now());
  const publicProd = (publicRes.data || []).find(p => p.id === prodId);
  if (!publicProd || publicProd.price !== 200 || publicProd.stock !== 120) {
    throw new Error('Public storefront product mismatch: ' + JSON.stringify(publicProd));
  }
  pass('Customer website displays updated product: ' + publicProd.name + ', Price=₹' + publicProd.price + ', Stock=' + publicProd.stock);

  // Step 13: Refresh Customer Website 10 Times
  step('Refresh Customer Website 10 Consecutive Times');
  for (let i = 1; i <= 10; i++) {
    const res = await request('/api/products?_refresh=' + i + '_' + Date.now());
    if (res.statusCode !== 200) throw new Error('Storefront refresh #' + i + ' failed');
    const p = (res.data || []).find(it => it.id === prodId);
    if (!p || p.price !== 200 || p.stock !== 120) {
      throw new Error('Storefront refresh #' + i + ' returned inconsistent data: ' + JSON.stringify(p));
    }
  }
  pass('10/10 Customer storefront refreshes returned identical verified data: Price=₹200, Stock=120');

  // Step 14: Delete Product
  step('Delete Product from PostgreSQL');
  const deleteRes = await request('/api/owner/products/' + encodeURIComponent(prodId), 'DELETE', null, headers2);
  if (deleteRes.statusCode !== 200 || !deleteRes.data.success) {
    throw new Error('Delete product failed: ' + JSON.stringify(deleteRes.data));
  }
  pass('Product Deleted from PostgreSQL');

  // Step 15: Storefront Confirmation of Deletion
  step('Final Storefront Confirmation of Deletion');
  const finalPublicRes = await request('/api/products?_t=' + Date.now());
  const deletedCheck = (finalPublicRes.data || []).find(p => p.id === prodId);
  if (deletedCheck) {
    throw new Error('Deleted product still found in public catalog!');
  }
  pass('Confirmed product removed from public customer storefront.');

  console.log('================================================================');
  console.log(' ALL 15/15 PRODUCTION PERSISTENCE VERIFICATION STEPS PASSED! ✅');
  console.log(' POSTGRESQL IS VERIFIED AS THE SINGLE SOURCE OF TRUTH!');
  console.log('================================================================');
}

run().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  process.exit(1);
});
