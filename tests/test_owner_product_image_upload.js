/**
 * tests/test_owner_product_image_upload.js
 * 
 * Verifies:
 * 1. Image Library Endpoint: GET /api/images/library
 * 2. Image Upload Security & Validation: Mime types, size limits, base64 payload
 * 3. Camera / File Upload Persistence: Uploads to disk & serves statically
 * 4. Product Creation with Uploaded Image: Saved to Neon PostgreSQL
 * 5. Product Update with Library Image: Updated in Neon PostgreSQL
 * 6. Audit Logging: Recorded in freshmart_audit_logs
 * 7. Storefront Delivery: Customer API returns updated product image URLs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { server } = require('../server');
const db = require('../database');

let testPort = 8092;
let serverInstance = null;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed, raw: body });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (typeof postData === 'object') {
        req.write(JSON.stringify(postData));
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Test Suite: Owner Product Image Upload & Library Integration\n');
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
    // 1. Start Server
    await new Promise(resolve => {
      serverInstance = server.listen(testPort, () => {
        console.log(`  🌐 Test server listening on port ${testPort}`);
        resolve();
      });
    });

    // Step 1: Verify GET /api/images/library returns curated items
    console.log('\n--- Step 1: Verify GET /api/images/library ---');
    const libRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/images/library',
      method: 'GET'
    });
    assert(libRes.statusCode === 200, `Image library returns HTTP 200 (Got ${libRes.statusCode})`);
    assert(libRes.data && libRes.data.success === true, 'Image library response has success: true');
    assert(Array.isArray(libRes.data.images) && libRes.data.images.length >= 20, `Library has ${libRes.data?.images?.length || 0} images`);
    const sampleImg = libRes.data.images[0];
    assert(sampleImg.id && sampleImg.title && sampleImg.category && sampleImg.url && sampleImg.thumbnail, 'Library item contains id, title, category, url, and thumbnail');

    // Filter library by category
    const vegLibRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/images/library?category=Vegetables',
      method: 'GET'
    });
    assert(vegLibRes.statusCode === 200, 'Category-filtered library returns HTTP 200');
    assert(vegLibRes.data.images.every(i => (i.category || '').toLowerCase().includes('veg')), 'All filtered images belong to Vegetables category');

    // Step 2: Validate POST /api/upload/image Validation & Security
    console.log('\n--- Step 2: Validate POST /api/upload/image Security & Limits ---');
    
    // Invalid mime type
    const invalidMimeRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/upload/image',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      data: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2Jq',
      mimeType: 'application/pdf'
    });
    assert(invalidMimeRes.statusCode === 400, `Rejects invalid MIME type with HTTP 400 (Got ${invalidMimeRes.statusCode})`);
    assert(invalidMimeRes.data.error.includes('Invalid file type'), 'Returns informative invalid file type error');

    // Missing data
    const noDataRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/upload/image',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    assert(noDataRes.statusCode === 400, 'Rejects empty payload with HTTP 400');

    // Step 3: Upload Valid Base64 Image (Simulating Camera Capture / File Selection)
    console.log('\n--- Step 3: Upload Base64 Image (Camera/File Upload) ---');
    // 1x1 transparent PNG / test image in base64
    const validPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/upload/image',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      data: validPngBase64
    });
    assert(uploadRes.statusCode === 201, `Valid image upload returns HTTP 201 (Got ${uploadRes.statusCode})`);
    assert(uploadRes.data.success === true, 'Upload response has success: true');
    assert(uploadRes.data.url && uploadRes.data.url.startsWith('/uploads/product_'), `Returns valid uploaded URL: ${uploadRes.data.url}`);
    assert(uploadRes.data.mimeType === 'image/png', 'Returns correct MIME type');

    const uploadedUrl = uploadRes.data.url;

    // Step 4: Verify Static Serving of Uploaded File
    console.log('\n--- Step 4: Verify Static Serving of Uploaded File ---');
    const staticRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: uploadedUrl,
      method: 'GET'
    });
    assert(staticRes.statusCode === 200, `Uploaded image statically served with HTTP 200 (Got ${staticRes.statusCode})`);
    assert(staticRes.headers['content-type'] === 'image/png', `Uploaded image served with Content-Type image/png (Got ${staticRes.headers['content-type']})`);

    // Step 5: Owner Login and Product Creation with Uploaded Image
    console.log('\n--- Step 5: Owner Creates Product with Uploaded Image ---');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'piyushverma730929@gmail.com',
      password: 'password123'
    });
    assert(loginRes.statusCode === 200 && loginRes.data.success, 'Owner authentication succeeded');
    const cookieHeader = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    const token = loginRes.data.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
      'Authorization': `Bearer ${token}`
    };

    const newProdPayload = {
      name: 'Hydroponic Purple Cabbage ' + Date.now(),
      hindiName: 'बैंगनी पत्तागोभी',
      category: 'Vegetables',
      subcategory: 'Exotics',
      unit: '500 g',
      price: 80,
      mrp: 110,
      costPrice: 50,
      stock: 45,
      lowStockLimit: 10,
      farmer: 'Nilgiri Hydroponic Hub',
      image: uploadedUrl,
      description: 'Fresh crisp purple cabbage rich in anthocyanins.'
    };

    const createProdRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/owner/products',
      method: 'POST',
      headers: authHeaders
    }, newProdPayload);

    assert(createProdRes.statusCode === 201, `Product creation returns HTTP 201 (Got ${createProdRes.statusCode})`);
    assert(createProdRes.data.product && createProdRes.data.product.image === uploadedUrl, `Product saved with uploaded image URL: ${createProdRes.data?.product?.image}`);
    const createdId = createProdRes.data.product.id;

    // Verify persistence in PostgreSQL / DB
    const persistedProd = db.getById('products', createdId);
    assert(persistedProd !== null, 'Product found in database');
    assert(persistedProd.image === uploadedUrl, 'Product in PostgreSQL has exact uploaded image URL');

    // Step 6: Owner Updates Product with Library Image
    console.log('\n--- Step 6: Owner Updates Product with Image from Library ---');
    const libraryImageUrl = 'https://images.unsplash.com/photo-1546470427-227c7369a4d0?auto=format&fit=crop&w=700&q=80';
    const updatePayload = {
      ...persistedProd,
      image: libraryImageUrl,
      imageUrl: libraryImageUrl
    };

    const updateProdRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/owner/products/${createdId}`,
      method: 'PUT',
      headers: authHeaders
    }, updatePayload);

    assert(updateProdRes.statusCode === 200, `Product update returns HTTP 200 (Got ${updateProdRes.statusCode})`);
    assert(updateProdRes.data.product.image === libraryImageUrl, `Updated product image matches library image URL: ${updateProdRes.data.product.image}`);

    const updatedDbProd = db.getById('products', createdId);
    assert(updatedDbProd.image === libraryImageUrl, 'Product in PostgreSQL reflects updated library image URL');

    // Step 7: Verify Audit Logging in freshmart_audit_logs
    console.log('\n--- Step 7: Verify Audit Logging ---');
    const auditLogs = db.getAll('audit_logs') || [];
    const prodCreatedLog = auditLogs.find(l => l.entityId === createdId || (l.details && l.details.includes(createdId)));
    assert(prodCreatedLog !== undefined, 'Activity log exists for product creation');

    // Step 8: Verify Customer Storefront API
    console.log('\n--- Step 8: Customer Storefront API Returns Updated Image ---');
    const storefrontRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/products',
      method: 'GET'
    });
    assert(storefrontRes.statusCode === 200, 'Customer storefront API returns HTTP 200');
    const storefrontProd = storefrontRes.data.find(p => p.id === createdId);
    assert(storefrontProd !== undefined, 'Customer API includes newly created produce');
    assert(storefrontProd.image === libraryImageUrl, 'Customer API provides updated permanent image URL to storefront');

    console.log(`\n========================================================`);
    console.log(`📊 Image Upload Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
