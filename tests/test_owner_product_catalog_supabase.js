/**
 * Verification Test: Owner Console Product Catalog <-> Supabase PostgreSQL Single Source of Truth
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const { Pool } = require('pg');

const TEST_PORT = 8123;
let serverProcess = null;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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

async function run() {
  console.log('🚀 Starting Product Catalog <-> Supabase Verification Test...');

  // 1. Direct Supabase PostgreSQL Connection
  const PostgresAdapter = require('../database/adapters/postgresAdapter');
  const adapter = new PostgresAdapter();
  await adapter.init();
  const pool = adapter.getPool();

  const countRes = await pool.query('SELECT COUNT(*) FROM freshmart_products');
  console.log(`✅ Supabase freshmart_products connected! Total active count: ${countRes.rows[0].count}`);

  // 2. Start local FreshMart server
  console.log(`📡 Starting server on port ${TEST_PORT}...`);
  serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Login / get Owner auth cookie via Google OAuth
  console.log('🔑 Authenticating as Owner (piyushverma730929@gmail.com via Google OAuth)...');
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
  }, {
    credential: mockJwt
  });

  const setCookie = loginRes.headers['set-cookie'];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
  const token = loginRes.body?.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  console.log(`✅ Logged in as: ${loginRes.body?.user?.name} (Role: ${loginRes.body?.user?.role})`);

  // 4. Test GET /api/owner/products
  console.log('📦 Fetching Owner Catalog (GET /api/owner/products)...');
  const catalogRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/owner/products',
    method: 'GET',
    headers: authHeaders
  });
  console.log(`✅ Owner Catalog loaded ${catalogRes.body?.length || 0} products from Supabase.`);

  // 5. Test Add Product (POST /api/owner/products)
  const testProdId = `prod_test_${Date.now()}`;
  const newProductPayload = {
    id: testProdId,
    name: 'Organic Shimla Apple Gold',
    hindiName: 'शिमला सेब',
    category: 'Fresh Fruits',
    subcategory: 'Apples & Pears',
    unit: '1 kg',
    price: 180,
    mrp: 240,
    costPrice: 120,
    stock: 50,
    lowStockLimit: 10,
    farmer: 'Himachal Orchardists Collective',
    freshnessDays: 7,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
    description: 'Crisp, sweet, organic Himalayan high-altitude apples.'
  };

  console.log(`🥬 Adding new produce item: "${newProductPayload.name}"...`);
  const createRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/owner/products',
    method: 'POST',
    headers: authHeaders
  }, newProductPayload);

  if (createRes.statusCode !== 201 || !createRes.body?.success) {
    throw new Error(`Failed to create product: ${JSON.stringify(createRes.body)}`);
  }
  console.log(`✅ Produce item created successfully! ID: ${createRes.body.product.id}`);

  // 6. Verify directly in Supabase PostgreSQL
  console.log('🔍 Querying Supabase PostgreSQL directly to verify column persistence...');
  const directPgRes = await pool.query('SELECT * FROM freshmart_products WHERE id = $1', [testProdId]);
  if (directPgRes.rows.length === 0) {
    throw new Error('Test product NOT found in Supabase freshmart_products table!');
  }
  const row = directPgRes.rows[0];
  console.log(`✅ Verified in Supabase PostgreSQL:
    - ID: ${row.id}
    - Name: ${row.name}
    - Category: ${row.category}
    - Category ID: ${row.category_id}
    - Category Slug: ${row.category_slug}
    - Price: ₹${row.price}
    - MRP: ₹${row.mrp}
    - Cost Price: ₹${row.cost_price}
    - Stock: ${row.stock} kg
    - Status: ${row.status}
    - Farmer: ${row.farmer}`);

  // 7. Verify Customer Storefront API (GET /api/products)
  console.log('🛒 Checking Customer Storefront API for the new product...');
  const customerApiRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/products?category=fruits',
    method: 'GET'
  });
  const foundInCustomerApi = (customerApiRes.body || []).find(p => p.id === testProdId);
  if (!foundInCustomerApi) {
    throw new Error('New product not returned in Customer API /api/products!');
  }
  console.log(`✅ Verified on Customer Storefront: "${foundInCustomerApi.name}" is LIVE with Price ₹${foundInCustomerApi.price} & Stock ${foundInCustomerApi.stock}`);

  // 8. Test Edit Product (PUT /api/owner/products/:id)
  console.log('✏️ Updating product specifications (Price: ₹195, Stock: 75)...');
  const editPayload = {
    ...newProductPayload,
    price: 195,
    mrp: 250,
    stock: 75,
    description: 'Updated premium Himalayan high-altitude organic apples.'
  };

  const editRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: `/api/owner/products/${testProdId}`,
    method: 'PUT',
    headers: authHeaders
  }, editPayload);

  if (editRes.statusCode !== 200 || !editRes.body?.success) {
    throw new Error(`Failed to edit product: ${JSON.stringify(editRes.body)}`);
  }

  const updatedPgRes = await pool.query('SELECT price, stock, description FROM freshmart_products WHERE id = $1', [testProdId]);
  console.log(`✅ Supabase verified after edit: Price = ₹${updatedPgRes.rows[0].price}, Stock = ${updatedPgRes.rows[0].stock}`);

  // 9. Test Product Suspension (PATCH /api/owner/products/:id/status)
  console.log('⏸️ Suspending product from customer storefront...');
  const suspendRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: `/api/owner/products/${testProdId}/status`,
    method: 'PATCH',
    headers: authHeaders
  }, { status: 'SUSPENDED' });

  if (suspendRes.statusCode !== 200 || suspendRes.body?.product?.status !== 'SUSPENDED') {
    throw new Error(`Failed to suspend product: ${JSON.stringify(suspendRes.body)}`);
  }

  // Customer API should NOT show suspended product
  const custAfterSuspend = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/products',
    method: 'GET'
  });
  const visibleToCustomer = (custAfterSuspend.body || []).some(p => p.id === testProdId);
  if (visibleToCustomer) {
    throw new Error('Suspended product is still visible on customer storefront!');
  }
  console.log('✅ Suspended product successfully hidden from customer storefront!');

  // Owner Catalog SHOULD still show suspended product
  const ownerAfterSuspend = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: '/api/owner/products',
    method: 'GET',
    headers: authHeaders
  });
  const foundInOwner = (ownerAfterSuspend.body || []).find(p => p.id === testProdId);
  if (!foundInOwner || foundInOwner.status !== 'SUSPENDED') {
    throw new Error('Suspended product not found or status incorrect in Owner Catalog!');
  }
  console.log('✅ Owner Catalog correctly lists suspended product with status "SUSPENDED"');

  // 10. Test Reactivating Product
  console.log('🟢 Reactivating product...');
  await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: `/api/owner/products/${testProdId}/status`,
    method: 'PATCH',
    headers: authHeaders
  }, { status: 'ACTIVE' });

  // 11. Test Delete Product (DELETE /api/owner/products/:id)
  console.log('🗑️ Deleting test product...');
  const deleteRes = await makeRequest({
    hostname: 'localhost',
    port: TEST_PORT,
    path: `/api/owner/products/${testProdId}`,
    method: 'DELETE',
    headers: authHeaders
  });

  if (deleteRes.statusCode !== 200 || !deleteRes.body?.success) {
    throw new Error(`Failed to delete product: ${JSON.stringify(deleteRes.body)}`);
  }

  const checkDeletedPg = await pool.query('SELECT * FROM freshmart_products WHERE id = $1', [testProdId]);
  if (checkDeletedPg.rows.length > 0) {
    throw new Error('Product still exists in Supabase after DELETE!');
  }
  console.log('✅ Product successfully deleted from Supabase PostgreSQL!');

  await pool.end();
  console.log('\n🎉 ALL OWNER PRODUCT CATALOG <-> SUPABASE TESTS PASSED 100%!');
}

run()
  .then(() => {
    if (serverProcess) serverProcess.kill();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Test failed:', err);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  });
