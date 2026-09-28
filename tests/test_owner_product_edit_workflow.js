/**
 * Targeted Test: Owner Console Product Editing -> Supabase PostgreSQL -> Customer Website Flow
 */
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');
const PostgresAdapter = require('../database/adapters/postgresAdapter');

const TEST_PORT = 8124;
let serverProcess = null;

function makeRequest(options, postData = null) {
  const isHttps = options.protocol === 'https:' || options.port === 443;
  const client = isHttps ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) { json = body; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'object' ? JSON.stringify(postData) : postData);
    }
    req.end();
  });
}

async function runTest() {
  console.log('======================================================================');
  console.log('🎯 VERIFICATION: Owner Product Edit -> Supabase -> Customer Storefront');
  console.log('======================================================================\n');

  // 1. Initialize Supabase PostgreSQL Adapter
  console.log('🔗 Step 1: Connecting to Supabase PostgreSQL database...');
  const adapter = new PostgresAdapter();
  await adapter.init();
  const pool = adapter.getPool();

  const initialCountRes = await pool.query('SELECT COUNT(*) FROM freshmart_products');
  const initialTotalProducts = parseInt(initialCountRes.rows[0].count, 10);
  console.log(`✅ Connected to Supabase! Total products in freshmart_products: ${initialTotalProducts}`);

  // 2. Start local server
  console.log(`\n📡 Step 2: Starting server instance on port ${TEST_PORT}...`);
  serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Owner Login
  console.log('\n🔑 Step 3: Authenticating as Store Owner (piyushverma730929@gmail.com)...');
  const googlePayload = {
    iss: 'https://accounts.google.com',
    aud: '880806707459-ci9gcf8sni1h6u0gmd1qtp96mg2u9l9g.apps.googleusercontent.com',
    sub: 'google_sub_piyush_owner_permanent',
    email: 'piyushverma730929@gmail.com',
    email_verified: true,
    name: 'Piyush Verma',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const mockJwt = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(googlePayload)}.mock_signature`;

  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/auth/google',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { credential: mockJwt });

  if (![200, 201].includes(loginRes.statusCode) || !loginRes.body?.user) {
    throw new Error(`Owner authentication failed (status ${loginRes.statusCode}): ${JSON.stringify(loginRes.body)}`);
  }

  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
  const token = loginRes.body?.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  console.log(`✅ Authenticated as: ${loginRes.body.user.name} (${loginRes.body.user.role})`);

  // 4. Open Owner Console Product Catalog (GET /api/owner/products)
  console.log('\n📋 Step 4: Loading Product Catalog from Supabase...');
  const catalogRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/owner/products?_t=' + Date.now(),
    method: 'GET',
    headers: authHeaders
  });

  const productsList = catalogRes.body;
  if (!Array.isArray(productsList) || productsList.length === 0) {
    throw new Error('Owner product catalog failed to load products from database');
  }
  console.log(`✅ Loaded ${productsList.length} products from Supabase freshmart_products table.`);

  // 5. Select an existing product
  const targetProduct = productsList.find(p => p.id === 'prod_tomato') || productsList[0];
  const targetId = targetProduct.id;
  const originalName = targetProduct.name;
  const originalPrice = targetProduct.price;
  console.log(`\n🎯 Step 5: Selected Existing Product for Edit:
    - ID: "${targetId}"
    - Current Name: "${originalName}"
    - Current Price: ₹${originalPrice}
    - Current Stock: ${targetProduct.stock} ${targetProduct.unit || 'kg'}`);

  // 6. Edit Product specifications (Name, Price, MRP, Stock, Description, Image)
  const updatedName = `${originalName} (Heritage Farm Special)`;
  const updatedPrice = originalPrice === 75 ? 85 : 75;
  const updatedMrp = Math.round(updatedPrice * 1.3);
  const updatedStock = 320;
  const updatedDesc = `Certified organic harvest plucked at sunrise. Peak freshness guaranteed. Tested at ${new Date().toISOString()}`;
  const updatedImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80';

  console.log(`\n✏️ Step 6: Owner modifies product fields and submits edit:
    - New Name: "${updatedName}"
    - New Price: ₹${updatedPrice} (MRP: ₹${updatedMrp})
    - New Stock: ${updatedStock}
    - New Image: ${updatedImage}
    - New Description: "${updatedDesc.slice(0, 50)}..."`);

  const editPayload = {
    ...targetProduct,
    id: targetId,
    name: updatedName,
    title: updatedName,
    price: updatedPrice,
    sellingPrice: updatedPrice,
    mrp: updatedMrp,
    originalPrice: updatedMrp,
    stock: updatedStock,
    status: 'ACTIVE',
    image: updatedImage,
    imageUrl: updatedImage,
    description: updatedDesc
  };

  const saveRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: `/api/owner/products/${encodeURIComponent(targetId)}`,
    method: 'PUT',
    headers: authHeaders
  }, editPayload);

  if (saveRes.statusCode !== 200 || !saveRes.body?.success || !saveRes.body?.product) {
    throw new Error(`Failed to save product changes: ${JSON.stringify(saveRes.body)}`);
  }
  console.log(`✅ Backend API (PUT /api/owner/products/${targetId}) confirmed update: HTTP 200 OK`);

  // 7. Verify directly in Supabase PostgreSQL (Single Source of Truth)
  console.log('\n🔍 Step 7: Verifying Supabase PostgreSQL freshmart_products table directly...');
  const directPgRes = await pool.query('SELECT * FROM freshmart_products WHERE id = $1', [targetId]);
  if (directPgRes.rows.length === 0) {
    throw new Error(`Product ${targetId} not found in Supabase!`);
  }
  const pgRow = directPgRes.rows[0];
  console.log(`✅ Direct Supabase PostgreSQL query result:
    - id: ${pgRow.id}
    - name: "${pgRow.name}"
    - price: ₹${pgRow.price} (selling_price: ₹${pgRow.selling_price})
    - mrp: ₹${pgRow.mrp}
    - stock: ${pgRow.stock}
    - status: ${pgRow.status}
    - image: ${pgRow.image}
    - updated_at: ${pgRow.updated_at}`);

  if (pgRow.name !== updatedName) throw new Error(`Supabase name mismatch: expected "${updatedName}", got "${pgRow.name}"`);
  if (Number(pgRow.price) !== updatedPrice) throw new Error(`Supabase price mismatch: expected ${updatedPrice}, got ${pgRow.price}`);
  if (Number(pgRow.stock) !== updatedStock) throw new Error(`Supabase stock mismatch: expected ${updatedStock}, got ${pgRow.stock}`);
  if (pgRow.image !== updatedImage) throw new Error(`Supabase image mismatch: expected "${updatedImage}", got "${pgRow.image}"`);

  // 8. Verify No Duplicate Row Created
  console.log('\n🔒 Step 8: Verifying NO duplicate row was created in Supabase...');
  const idCountRes = await pool.query('SELECT COUNT(*) FROM freshmart_products WHERE id = $1', [targetId]);
  const exactRowCount = parseInt(idCountRes.rows[0].count, 10);
  if (exactRowCount !== 1) {
    throw new Error(`Expected exactly 1 row for ID "${targetId}", found ${exactRowCount}!`);
  }
  const totalCountRes = await pool.query('SELECT COUNT(*) FROM freshmart_products');
  const currentTotal = parseInt(totalCountRes.rows[0].count, 10);
  if (currentTotal !== initialTotalProducts) {
    throw new Error(`Total products count changed from ${initialTotalProducts} to ${currentTotal}! A duplicate was created.`);
  }
  console.log(`✅ Exact row count for "${targetId}": ${exactRowCount} (Total database count unchanged at ${currentTotal})`);

  // 9. Refresh Owner Console Catalog (Simulating browser refresh)
  console.log('\n🔄 Step 9: Refreshing Owner Console Product Catalog...');
  const refreshedOwnerRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/owner/products?_t=' + Date.now(),
    method: 'GET',
    headers: authHeaders
  });
  const refreshedOwnerProd = refreshedOwnerRes.body.find(p => p.id === targetId);
  if (!refreshedOwnerProd) throw new Error('Edited product not found in refreshed owner catalog');
  if (refreshedOwnerProd.name !== updatedName || Number(refreshedOwnerProd.price) !== updatedPrice) {
    throw new Error('Refreshed Owner Catalog did not preserve edited values');
  }
  console.log(`✅ Refreshed Owner Console confirmed updated values:
    - Name: "${refreshedOwnerProd.name}"
    - Price: ₹${refreshedOwnerProd.price}
    - Stock: ${refreshedOwnerProd.stock}`);

  // 10. Customer Website fetches updated catalog
  console.log('\n🛒 Step 10: Opening/Refreshing Customer Website (GET /api/products)...');
  const customerRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/products?_t=' + Date.now(),
    method: 'GET',
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
  });

  const customerProd = (customerRes.body || []).find(p => p.id === targetId || p.storefrontId === targetProduct.storefrontId);
  if (!customerProd) {
    throw new Error('Product not returned on customer storefront!');
  }
  console.log(`✅ Customer Website received updated product from Supabase:
    - Name: "${customerProd.name}"
    - Price: ₹${customerProd.price}
    - MRP: ₹${customerProd.mrp}
    - Stock: ${customerProd.stock}
    - Image: ${customerProd.image}
    - Description: "${customerProd.description.slice(0, 50)}..."`);

  if (customerProd.name !== updatedName) throw new Error(`Customer storefront name mismatch: expected "${updatedName}", got "${customerProd.name}"`);
  if (Number(customerProd.price) !== updatedPrice) throw new Error(`Customer storefront price mismatch: expected ${updatedPrice}, got ${customerProd.price}`);
  if (Number(customerProd.stock) !== updatedStock) throw new Error(`Customer storefront stock mismatch: expected ${updatedStock}, got ${customerProd.stock}`);
  if (customerProd.image !== updatedImage) throw new Error(`Customer storefront image mismatch: expected "${updatedImage}", got "${customerProd.image}"`);

  // 11. Revert product back to clean state
  console.log('\n🧹 Step 11: Restoring original values for clean test state...');
  await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: `/api/owner/products/${encodeURIComponent(targetId)}`,
    method: 'PUT',
    headers: authHeaders
  }, {
    ...targetProduct,
    id: targetId,
    name: originalName,
    title: originalName,
    price: originalPrice,
    sellingPrice: originalPrice,
    stock: targetProduct.stock,
    status: 'ACTIVE'
  });
  console.log('✅ Clean state restored.');

  await pool.end();
  console.log('\n======================================================================');
  console.log('🎉 ALL TESTS PASSED! Owner Edit -> Supabase -> Customer Website Flow Verified');
  console.log('======================================================================');
}

runTest()
  .then(() => {
    if (serverProcess) serverProcess.kill();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  });
