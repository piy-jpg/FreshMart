/**
 * Comprehensive Test: Single Source of Truth Product System
 * Flow:
 * Owner Dashboard -> Update Product API -> Production Database -> Customer Website API -> Live Vercel Website
 */

const assert = require('assert');
const http = require('http');
const vercelHandler = require('../api/index');
const { db } = require('../database/connection');

function callApi(method, path, body = null, headers = {}) {
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
      req.push(JSON.stringify(body));
    }
    req.push(null);

    const res = new http.ServerResponse(req);
    let output = '';
    let statusCode = 200;
    const responseHeaders = {};

    res.writeHead = (code, hdrs) => {
      statusCode = code;
      if (hdrs) Object.assign(responseHeaders, hdrs);
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

async function verifySingleSourceOfTruth() {
  console.log('🏛️ Verifying Single Source of Truth Architecture...\n');

  // 1. Owner authenticates
  const loginRes = await callApi('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'password123'
  });
  assert.strictEqual(loginRes.statusCode, 200, 'Owner login failed');
  const token = loginRes.body?.session?.token || loginRes.body?.token;
  const cookie = loginRes.headers['set-cookie'];
  const authHeaders = {
    authorization: 'Bearer ' + token,
    'x-session-token': token,
    cookie: Array.isArray(cookie) ? cookie[0] : (cookie || '')
  };

  const targetId = 'prod_tomato';
  console.log('Target SKU:', targetId);

  // Step A: Owner updates price to ₹200
  console.log('\n--- Step A: Owner updates price to ₹200 ---');
  const updateA = await callApi('PUT', '/api/owner/products/' + targetId, {
    name: 'Fresh Organic Desi Tomato',
    price: 200,
    sellingPrice: 200,
    mrp: 240,
    stock: 350,
    category: 'Vegetables',
    description: 'Farm-fresh organic tomato directly harvested from Mysore belt.',
    image: 'https://images.unsplash.com/photo-1546470427-227c7369a4d0?auto=format&fit=crop&w=400&q=80',
    status: 'ACTIVE'
  }, authHeaders);

  assert.strictEqual(updateA.statusCode, 200, 'Update A failed');
  assert.strictEqual(updateA.body.product.price, 200, 'Returned price must be 200');

  // Verify production database record
  const dbRecordA = db.getById('products', targetId);
  assert.strictEqual(dbRecordA.price, 200, 'Database price must be ₹200');
  assert.strictEqual(dbRecordA.stock, 350, 'Database stock must be 350');
  console.log('  ✅ Database record price: ₹' + dbRecordA.price);

  // Customer website API fetches from DB
  const custA = await callApi('GET', '/api/products');
  const prodOnCustA = custA.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(prodOnCustA.price, 200, 'Customer website must show ₹200');
  assert.strictEqual(prodOnCustA.stock, 350, 'Customer website must show 350 stock');
  console.log('  ✅ Customer website API price: ₹' + prodOnCustA.price);

  // Step B: Owner updates price to ₹250
  console.log('\n--- Step B: Owner updates price to ₹250 ---');
  const updateB = await callApi('PUT', '/api/owner/products/' + targetId, {
    name: 'Fresh Organic Desi Tomato',
    price: 250,
    sellingPrice: 250,
    mrp: 299,
    stock: 280,
    category: 'Vegetables',
    description: 'Farm-fresh organic tomato directly harvested from Mysore belt.',
    image: 'https://images.unsplash.com/photo-1546470427-227c7369a4d0?auto=format&fit=crop&w=400&q=80',
    status: 'ACTIVE'
  }, authHeaders);

  assert.strictEqual(updateB.statusCode, 200, 'Update B failed');
  assert.strictEqual(updateB.body.product.price, 250, 'Returned price must be 250');

  const dbRecordB = db.getById('products', targetId);
  assert.strictEqual(dbRecordB.price, 250, 'Database price must be ₹250');
  console.log('  ✅ Database record price: ₹' + dbRecordB.price);

  const custB = await callApi('GET', '/api/products');
  const prodOnCustB = custB.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(prodOnCustB.price, 250, 'Customer website must show ₹250');
  assert.strictEqual(prodOnCustB.stock, 280, 'Customer website must show 280 stock');
  console.log('  ✅ Customer website API price: ₹' + prodOnCustB.price);

  // Step C: Verify Cache-Control headers on customer website API
  console.log('\n--- Step C: Cache-Control & Revalidation Headers ---');
  assert((custB.headers['cache-control'] || custB.headers['Cache-Control'] || '').includes('no-cache') || custB.headers['cache-control'].includes('no-store'), 'Must prevent stale edge caching');
  console.log('  ✅ Cache-Control: ' + custB.headers['cache-control']);

  console.log('\n========================================================');
  console.log('🎉 ALL SINGLE SOURCE OF TRUTH VERIFICATIONS PASSED 100%!');
  console.log('========================================================\n');
}

verifySingleSourceOfTruth().catch(console.error);
