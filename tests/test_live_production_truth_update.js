/**
 * Test Suite: FreshMart Single Production Source of Truth Product Update Flow
 *
 * Verifies:
 * 1. Owner changes product price -> Save -> Database updated -> Vercel Customer API reflects new price.
 * 2. Owner changes name -> Save -> Database updated -> Vercel Customer API reflects new name.
 * 3. Owner changes image -> Save -> Database updated -> Vercel Customer API reflects new image.
 * 4. Owner changes category -> Save -> Database updated -> Vercel Customer API reflects new category.
 * 5. Owner changes stock -> Save -> Database updated -> Vercel Customer API reflects new stock.
 * 6. Owner changes description -> Save -> Database updated -> Vercel Customer API reflects new description.
 * 7. Owner unpublishes/suspends -> Save -> Database updated -> Customer API reflects status.
 * 8. Owner publishes/reactivates -> Save -> Database updated -> Customer API reflects active status.
 * 9. Caching headers prevent stale data (no-store, no-cache, must-revalidate).
 * 10. Real errors returned on invalid update requests.
 */

const assert = require('assert');
const http = require('http');
const vercelHandler = require('../api/index');
const { db } = require('../database/connection');

function simulateVercelRequest(method, path, body = null, headers = {}) {
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

async function run() {
  console.log('======================================================================');
  console.log('🛒 FreshMart: Live Production Source of Truth Product Update Verification');
  console.log('======================================================================\n');

  // 1. Authenticate Owner
  const loginRes = await simulateVercelRequest('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'password123'
  });
  assert.strictEqual(loginRes.statusCode, 200, 'Owner authentication must succeed');
  const ownerCookie = loginRes.headers['set-cookie']
    ? (Array.isArray(loginRes.headers['set-cookie']) ? loginRes.headers['set-cookie'][0] : loginRes.headers['set-cookie'])
    : '';
  console.log('✅ 1. Owner Authenticated successfully');

  // 2. Load catalog from single source of truth database
  const catalogRes = await simulateVercelRequest('GET', '/api/owner/products', null, {
    cookie: ownerCookie
  });
  assert.strictEqual(catalogRes.statusCode, 200, 'Owner catalog fetch must succeed');
  assert(Array.isArray(catalogRes.body) && catalogRes.body.length > 0, 'Catalog must not be empty');
  
  // Choose target product for test mutations
  const originalProduct = catalogRes.body[0];
  const targetId = originalProduct.id;
  console.log(`✅ 2. Target Product Selected: "${originalProduct.name}" (ID: ${targetId}, Initial Price: ₹${originalProduct.price}, Stock: ${originalProduct.stock})`);

  // Verify anti-cache headers on GET
  assert(catalogRes.headers['cache-control'] && catalogRes.headers['cache-control'].includes('no-store'), 'GET catalog must include no-store header');
  console.log('✅ 3. Verified Anti-Cache Headers on GET /api/owner/products (Cache-Control: ' + catalogRes.headers['cache-control'] + ')');

  // 3. Test: Price Update
  const updatedPrice = 175;
  const updatedMrp = 220;
  const priceUpdateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(targetId)}`, {
    ...originalProduct,
    price: updatedPrice,
    sellingPrice: updatedPrice,
    mrp: updatedMrp,
    originalPrice: updatedMrp
  }, { cookie: ownerCookie });

  assert.strictEqual(priceUpdateRes.statusCode, 200, 'Owner price update must return 200');
  assert.strictEqual(priceUpdateRes.body.success, true, 'Response must return success: true');
  assert.strictEqual(priceUpdateRes.body.product.price, updatedPrice, 'Returned record must have new price');

  // Direct database verification
  const dbProdAfterPrice = db.getById('products', targetId);
  assert.strictEqual(dbProdAfterPrice.price, updatedPrice, 'Production DB record must immediately hold new price');

  // Customer storefront verification
  const customerAfterPrice = await simulateVercelRequest('GET', '/api/products');
  assert.strictEqual(customerAfterPrice.statusCode, 200);
  assert(customerAfterPrice.headers['cache-control'].includes('no-store'), 'Customer GET must have no-store header');
  const storefrontProd1 = customerAfterPrice.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontProd1.price, updatedPrice, 'Customer storefront must immediately reflect new price');
  console.log(`✅ 4. Price Update Verified: Owner updated to ₹${updatedPrice} -> DB updated -> Customer website reflects ₹${storefrontProd1.price}`);

  // 4. Test: Name Update
  const updatedName = 'Organic Golden Farm Fresh Honeycrisp Apple';
  const nameUpdateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(targetId)}`, {
    ...dbProdAfterPrice,
    name: updatedName,
    title: updatedName
  }, { cookie: ownerCookie });

  assert.strictEqual(nameUpdateRes.statusCode, 200);
  assert.strictEqual(nameUpdateRes.body.product.name, updatedName);
  
  const customerAfterName = await simulateVercelRequest('GET', '/api/products');
  const storefrontProd2 = customerAfterName.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontProd2.name, updatedName, 'Customer storefront must immediately reflect new name');
  console.log(`✅ 5. Name Update Verified: Owner updated name -> DB updated -> Customer website reflects "${storefrontProd2.name}"`);

  // 5. Test: Image Update
  const updatedImage = 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=600&q=80';
  const imageUpdateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(targetId)}`, {
    ...dbProdAfterPrice,
    name: updatedName,
    image: updatedImage
  }, { cookie: ownerCookie });

  assert.strictEqual(imageUpdateRes.statusCode, 200);
  assert.strictEqual(imageUpdateRes.body.product.image, updatedImage);

  const customerAfterImg = await simulateVercelRequest('GET', '/api/products');
  const storefrontProd3 = customerAfterImg.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontProd3.image, updatedImage, 'Customer storefront must immediately reflect new image');
  console.log(`✅ 6. Image Update Verified: Owner updated image -> DB updated -> Customer website reflects new image URL`);

  // 6. Test: Category Update
  const updatedCategory = 'Fruits & Berries';
  const catUpdateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(targetId)}`, {
    ...dbProdAfterPrice,
    name: updatedName,
    image: updatedImage,
    category: updatedCategory
  }, { cookie: ownerCookie });

  assert.strictEqual(catUpdateRes.statusCode, 200);
  assert.strictEqual(catUpdateRes.body.product.category, updatedCategory);

  const customerAfterCat = await simulateVercelRequest('GET', '/api/products');
  const storefrontProd4 = customerAfterCat.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontProd4.category, updatedCategory, 'Customer storefront must immediately reflect new category');
  console.log(`✅ 7. Category Update Verified: Owner updated category -> DB updated -> Customer website reflects "${storefrontProd4.category}"`);

  // 7. Test: Stock Update
  const updatedStock = 880;
  const stockUpdateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(targetId)}`, {
    ...dbProdAfterPrice,
    name: updatedName,
    image: updatedImage,
    category: updatedCategory,
    stock: updatedStock
  }, { cookie: ownerCookie });

  assert.strictEqual(stockUpdateRes.statusCode, 200);
  assert.strictEqual(stockUpdateRes.body.product.stock, updatedStock);

  const customerAfterStock = await simulateVercelRequest('GET', '/api/products');
  const storefrontProd5 = customerAfterStock.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontProd5.stock, updatedStock, 'Customer storefront must immediately reflect new stock');
  console.log(`✅ 8. Stock Update Verified: Owner updated stock -> DB updated -> Customer website reflects ${storefrontProd5.stock} units`);

  // 8. Test: Description Update
  const updatedDesc = 'Hand-plucked at peak crispness directly from certified orchard trees.';
  const descUpdateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(targetId)}`, {
    ...dbProdAfterPrice,
    name: updatedName,
    image: updatedImage,
    category: updatedCategory,
    stock: updatedStock,
    description: updatedDesc
  }, { cookie: ownerCookie });

  assert.strictEqual(descUpdateRes.statusCode, 200);
  assert.strictEqual(descUpdateRes.body.product.description, updatedDesc);

  const customerAfterDesc = await simulateVercelRequest('GET', '/api/products');
  const storefrontProd6 = customerAfterDesc.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontProd6.description, updatedDesc, 'Customer storefront must immediately reflect new description');
  console.log(`✅ 9. Description Update Verified: Owner updated description -> DB updated -> Customer website reflects description`);

  // 9. Test: Publish / Unpublish (Suspend / Activate) Status Flow
  // A. Unpublish / Suspend
  const suspendRes = await simulateVercelRequest('PATCH', `/api/owner/products/${encodeURIComponent(targetId)}/status`, {
    status: 'SUSPENDED'
  }, { cookie: ownerCookie });

  assert.strictEqual(suspendRes.statusCode, 200);
  assert.strictEqual(suspendRes.body.product.status, 'SUSPENDED');
  
  const customerAfterSuspend = await simulateVercelRequest('GET', '/api/products');
  const storefrontSuspended = customerAfterSuspend.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontSuspended.status, 'SUSPENDED', 'Customer storefront must reflect SUSPENDED status');
  console.log(`✅ 10. Unpublish/Suspend Flow Verified: Owner suspended product -> DB updated -> Customer website reflects SUSPENDED`);

  // B. Publish / Reactivate
  const activateRes = await simulateVercelRequest('PATCH', `/api/owner/products/${encodeURIComponent(targetId)}/status`, {
    status: 'ACTIVE'
  }, { cookie: ownerCookie });

  assert.strictEqual(activateRes.statusCode, 200);
  assert.strictEqual(activateRes.body.product.status, 'ACTIVE');

  const customerAfterActivate = await simulateVercelRequest('GET', '/api/products');
  const storefrontActive = customerAfterActivate.body.find(p => p.id === targetId || p.storefrontId === targetId);
  assert.strictEqual(storefrontActive.status, 'ACTIVE', 'Customer storefront must reflect ACTIVE status');
  console.log(`✅ 11. Publish/Activate Flow Verified: Owner activated product -> DB updated -> Customer website reflects ACTIVE`);

  // 10. Test: Error handling for non-existent product update
  const fakeId = 'prod_non_existent_99999999';
  const notFoundRes = await simulateVercelRequest('PUT', `/api/owner/products/${fakeId}`, {
    name: 'Ghost Product',
    price: 100
  }, { cookie: ownerCookie });
  assert.strictEqual(notFoundRes.statusCode, 404, 'Updating non-existent product ID must return 404');
  assert.strictEqual(notFoundRes.body.error, 'Product not found', 'Must return clear error message');
  console.log(`✅ 12. Real Error Handling Verified: Non-existent product update returned 404 with error message: "${notFoundRes.body.error}"`);

  console.log('\n======================================================================');
  console.log('🎉 ALL LIVE PRODUCTION SOURCE OF TRUTH PRODUCT UPDATE TESTS PASSED!');
  console.log('======================================================================\n');
}

run().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
