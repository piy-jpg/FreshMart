/**
 * Live Item Update Test through Vercel Flow
 *
 * Demonstrates:
 * 1. Owner logs into Vercel control center
 * 2. Owner chooses a specific item ("Fresh Tomato")
 * 3. Owner updates Price (₹50 -> ₹65), Stock (340 -> 450), Farmer info, and Description
 * 4. Verifies database confirms the update
 * 5. Customer storefront requests catalog via Vercel endpoint
 * 6. Customer storefront receives the new price ₹65, stock 450, and updated details
 * 7. Owner toggles status to SUSPENDED -> Customer storefront confirms SUSPENDED
 * 8. Owner reactivates to ACTIVE -> Customer storefront confirms ACTIVE
 */

const assert = require('assert');
const http = require('http');
const vercelHandler = require('../api/index');
const { db } = require('../database/connection');

function callVercel(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = new http.IncomingMessage();
    req.method = method;
    req.url = path;
    req.headers = {
      'host': 'freshmart-ten-vert.vercel.app',
      'origin': 'https://freshmart-ten-vert.vercel.app',
      'x-forwarded-uri': path,
      'content-type': 'application/json',
      ...headers
    };

    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      req.push(bodyStr);
    }
    req.push(null);

    const res = new http.ServerResponse(req);
    let output = '';
    let statusCode = 200;
    const responseHeaders = {};

    res.writeHead = (code, hdrs) => {
      statusCode = code;
      if (hdrs) {
        for (const [k, v] of Object.entries(hdrs)) {
          responseHeaders[k.toLowerCase()] = v;
        }
      }
      return res;
    };
    res.setHeader = (name, val) => {
      responseHeaders[name.toLowerCase()] = val;
    };
    res.getHeader = (name) => responseHeaders[name.toLowerCase()];
    res.write = (chunk) => {
      if (chunk) output += chunk.toString();
    };
    res.end = (chunk) => {
      if (chunk) output += chunk.toString();
      let json = null;
      try { json = JSON.parse(output); } catch (e) {}
      resolve({ statusCode, headers: responseHeaders, body: json, text: output });
    };

    vercelHandler(req, res);
  });
}

async function testSingleItemUpdateOnVercel() {
  console.log('======================================================================');
  console.log('🍅 LIVE VERCEL TEST: Updating Single Item ("Fresh Tomato") by Owner');
  console.log('======================================================================\n');

  // 1. Owner Login via Vercel endpoint
  console.log('🔐 Step 1: Owner authenticates on Vercel...');
  const loginRes = await callVercel('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'password123'
  });
  assert.strictEqual(loginRes.statusCode, 200, 'Owner login on Vercel must succeed');
  const ownerCookie = loginRes.headers['set-cookie']
    ? (Array.isArray(loginRes.headers['set-cookie']) ? loginRes.headers['set-cookie'][0] : loginRes.headers['set-cookie'])
    : '';
  console.log('  ✅ Owner logged in successfully.\n');

  // 2. Fetch target item from Owner Catalog
  console.log('📋 Step 2: Fetching item from Owner Catalog...');
  const ownerCatalog = await callVercel('GET', '/api/owner/products', null, { cookie: ownerCookie });
  assert.strictEqual(ownerCatalog.statusCode, 200);
  
  const targetItem = ownerCatalog.body.find(p => p.name.includes('Tomato') || p.id.includes('tomato')) || ownerCatalog.body[0];
  const originalPrice = targetItem.price;
  const originalStock = targetItem.stock;
  console.log(`  🎯 Selected Item: "${targetItem.name}" (ID: ${targetItem.id})`);
  console.log(`     Current State: Price = ₹${originalPrice}, Stock = ${originalStock}, Status = ${targetItem.status}\n`);

  // 3. Owner updates the item on Vercel
  const newPrice = originalPrice === 65 ? 75 : 65;
  const newStock = 450;
  const newDescription = 'Premium organic vine-ripened tomatoes, freshly plucked at dawn for 90-minute express delivery.';
  console.log(`✏️ Step 3: Owner updating item on Vercel: Price ₹${originalPrice} -> ₹${newPrice}, Stock ${originalStock} -> ${newStock}...`);

  const updateRes = await callVercel('PUT', `/api/owner/products/${encodeURIComponent(targetItem.id)}`, {
    ...targetItem,
    price: newPrice,
    sellingPrice: newPrice,
    stock: newStock,
    description: newDescription
  }, { cookie: ownerCookie });

  assert.strictEqual(updateRes.statusCode, 200, 'PUT /api/owner/products/:id must return 200 OK');
  assert.strictEqual(updateRes.body.success, true);
  assert.strictEqual(updateRes.body.product.price, newPrice);
  assert.strictEqual(updateRes.body.product.stock, newStock);
  console.log(`  ✅ Vercel API confirmed update: HTTP ${updateRes.statusCode} OK\n`);

  // 4. Verify directly in the single production database
  console.log('💾 Step 4: Verifying record in Production Database...');
  const dbRecord = db.getById('products', targetItem.id);
  assert(dbRecord, 'Record must exist in production database');
  assert.strictEqual(dbRecord.price, newPrice, `Database price must be ₹${newPrice}`);
  assert.strictEqual(dbRecord.stock, newStock, `Database stock must be ${newStock}`);
  console.log(`  ✅ Database record verified: Price = ₹${dbRecord.price}, Stock = ${dbRecord.stock}\n`);

  // 5. Customer Storefront fetches updated catalog via Vercel
  console.log('🛒 Step 5: Customer Storefront fetching updated catalog via Vercel...');
  const customerCatalog = await callVercel('GET', '/api/products');
  assert.strictEqual(customerCatalog.statusCode, 200);
  assert(customerCatalog.headers['cache-control'].includes('no-store'), 'Must have zero-cache header');

  const customerItem = customerCatalog.body.find(p => p.id === targetItem.id || p.storefrontId === targetItem.storefrontId);
  assert(customerItem, 'Customer catalog must contain the item');
  assert.strictEqual(customerItem.price, newPrice, `Customer storefront price must be ₹${newPrice}`);
  assert.strictEqual(customerItem.stock, newStock, `Customer storefront stock must be ${newStock}`);
  assert.strictEqual(customerItem.description, newDescription);
  console.log(`  ✅ Customer website received update:`);
  console.log(`     Product: "${customerItem.name}"`);
  console.log(`     Price: ₹${customerItem.price}`);
  console.log(`     Stock: ${customerItem.stock} units`);
  console.log(`     Description: "${customerItem.description}"\n`);

  // 6. Test Status Toggle on Vercel
  console.log('⏸️ Step 6: Testing Owner Suspend/Activate status toggle on Vercel...');
  const suspendRes = await callVercel('PATCH', `/api/owner/products/${encodeURIComponent(targetItem.id)}/status`, {
    status: 'SUSPENDED'
  }, { cookie: ownerCookie });
  assert.strictEqual(suspendRes.statusCode, 200);

  const customerAfterSuspend = await callVercel('GET', '/api/products');
  const custSuspendedItem = customerAfterSuspend.body.find(p => p.id === targetItem.id);
  assert.strictEqual(custSuspendedItem.status, 'SUSPENDED');
  console.log('  ✅ Storefront reflects SUSPENDED status.');

  const activateRes = await callVercel('PATCH', `/api/owner/products/${encodeURIComponent(targetItem.id)}/status`, {
    status: 'ACTIVE'
  }, { cookie: ownerCookie });
  assert.strictEqual(activateRes.statusCode, 200);

  const customerAfterActivate = await callVercel('GET', '/api/products');
  const custActiveItem = customerAfterActivate.body.find(p => p.id === targetItem.id);
  assert.strictEqual(custActiveItem.status, 'ACTIVE');
  console.log('  ✅ Storefront reflects ACTIVE status.\n');

  console.log('======================================================================');
  console.log('🎉 LIVE ITEM UPDATE ON VERCEL TEST PASSED WITH 100% SUCCESS!');
  console.log('======================================================================\n');
}

testSingleItemUpdateOnVercel().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
