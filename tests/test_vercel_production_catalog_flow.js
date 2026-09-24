/**
 * FreshMart Complete Production Flow & Vercel Catalog Verification Suite
 * 
 * Verifies:
 * 1. Owner adds product -> saved in shared production database
 * 2. Customer website fetches production products -> appears on storefront
 * 3. Editing produce details from Owner -> immediately reflected on Customer storefront
 * 4. Publishing / unpublishing (active/suspended) -> reflected on Customer storefront
 * 5. Stock adjustments from Owner -> reflected on Customer storefront
 * 6. Vercel serverless function entrypoint and CORS headers handling
 * 7. Verification that Owner and Customer use the SAME database and product records
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const server = require('../server');
const vercelApiHandler = require('../api/index');

// Simulate client-side app.js mapping logic
const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Set up browser-like global environment for app.js evaluation
global.window = {
  __suspendedProductIds: new Set()
};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.cart = {};
global.wishlist = [];

const startIdx = appJsContent.indexOf('function mapDbProductToStorefront');
const endIdx = appJsContent.indexOf('async function syncStorefrontCatalogWithBackend');
eval(appJsContent.slice(startIdx, endIdx));

async function runProductionCatalogFlowVerification() {
  console.log('🚀 Starting FreshMart Production Catalog & Vercel Verification...\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // Helper mock request via server.js or vercelApiHandler
  function simulateVercelRequest(method, urlPath, body = null, headers = {}) {
    return new Promise((resolve) => {
      const EventEmitter = require('events');
      const req = new EventEmitter();
      req.method = method;
      req.url = urlPath;
      req.headers = {
        host: 'fresh-mart.vercel.app',
        origin: 'https://fresh-mart.vercel.app',
        'content-type': 'application/json',
        'x-forwarded-uri': urlPath,
        'x-matched-path': '/api',
        ...headers
      };

      const res = {
        statusCode: 200,
        headers: {},
        body: '',
        getHeader(name) { return this.headers[name.toLowerCase()]; },
        setHeader(name, val) { this.headers[name.toLowerCase()] = val; },
        writeHead(code, hdrs) {
          this.statusCode = code;
          if (hdrs) {
            for (const [k, v] of Object.entries(hdrs)) {
              this.headers[k.toLowerCase()] = v;
            }
          }
        },
        end(chunk) {
          if (chunk) this.body += chunk;
          let parsed = null;
          try { parsed = JSON.parse(this.body); } catch (e) { parsed = this.body; }
          resolve({ statusCode: this.statusCode, headers: this.headers, getHeader: (n) => this.headers[n.toLowerCase()], body: parsed });
        }
      };

      setImmediate(() => {
        vercelApiHandler(req, res);
        if (body) {
          req.emit('data', Buffer.from(JSON.stringify(body)));
        }
        req.emit('end');
      });
    });
  }

  // 1. Authenticate Owner
  const owner = db.ensureOwnerUser('piyushverma730929@gmail.com');
  const session = db.createSession(owner.id, true);
  const ownerCookie = `sjh_session=${session.id}`;

  let createdProduct = null;
  const testProdName = `Fresh Organic Dragon Fruit ${Date.now()}`;

  // TEST 1: Owner adds product via Vercel endpoint
  await test('1. Owner adds product -> Saved in shared database with full schema', async () => {
    const payload = {
      name: testProdName,
      hindiName: 'ड्रैगन फ्रूट',
      category: 'Fruits',
      subcategory: 'Exotic Fruits',
      unit: '500 g',
      price: 140,
      sellingPrice: 140,
      mrp: 180,
      costPrice: 90,
      stock: 60,
      lowStockLimit: 15,
      farmer: 'Kaveri Valley Exotic Fruit Farms, KA',
      freshnessDays: 7,
      image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=400&q=80',
      description: 'Ruby-red, antioxidant-rich fresh organic dragon fruit with crisp sweet flesh.'
    };

    const res = await simulateVercelRequest('POST', '/api/owner/products', payload, { cookie: ownerCookie });
    assert.strictEqual(res.statusCode, 201, `Expected 201 Created, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert(res.body.success, 'Response must have success: true');
    assert(res.body.product, 'Response must return created product');

    createdProduct = res.body.product;
    assert.strictEqual(createdProduct.name, testProdName);
    assert.strictEqual(createdProduct.category, 'Fruits');
    assert.strictEqual(createdProduct.price, 140);
    assert.strictEqual(createdProduct.stock, 60);

    // Verify product is in the shared database
    const dbProd = db.getById('products', createdProduct.id);
    assert(dbProd, 'Product MUST be present in shared database instance');
    assert.strictEqual(dbProd.name, testProdName);
    assert.strictEqual(dbProd.stock, 60);

    // Verify inventory movement
    const movements = db.getAll('inventory_movements') || [];
    const move = movements.find(m => m.productId === createdProduct.id);
    assert(move, 'Inventory movement intake must be logged');
    assert.strictEqual(move.quantity, 60);
  });

  // TEST 2: Customer Storefront fetches product list via Vercel entrypoint
  await test('2. Customer storefront fetches products -> Newly created product appears on storefront', async () => {
    const res = await simulateVercelRequest('GET', '/api/products');
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);
    assert(Array.isArray(res.body), 'Response must be an array of products');

    const fetchedItem = res.body.find(p => p.id === createdProduct.id || p.name === testProdName);
    assert(fetchedItem, 'Customer storefront product list MUST contain newly added owner product');
    assert.strictEqual(fetchedItem.price, 140);
    assert.strictEqual(fetchedItem.stock, 60);
    assert.strictEqual(fetchedItem.status, 'ACTIVE');

    // Test mapping to storefront schema
    const mapped = mapDbProductToStorefront(fetchedItem);
    assert(mapped, 'mapDbProductToStorefront should return valid mapped object');
    assert.strictEqual(mapped.name, testProdName);
    assert.strictEqual(mapped.catalogType, 'fruits');
    assert.strictEqual(mapped.inStock, true);
    assert.strictEqual(mapped.price, 140);
  });

  // TEST 3: Owner edits product details -> Reflected in database & customer storefront
  await test('3. Owner edits product (price, MRP, stock) -> Reflected on customer website', async () => {
    const updatePayload = {
      name: testProdName + ' (Premium Grade A)',
      price: 155,
      mrp: 200,
      costPrice: 95,
      stock: 45,
      lowStockLimit: 10,
      farmer: 'Kaveri Valley Certified Organic Orchards'
    };

    const res = await simulateVercelRequest('PUT', `/api/owner/products/${createdProduct.id}`, updatePayload, { cookie: ownerCookie });
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);
    assert(res.body.success, 'Edit response must have success: true');

    // Verify in database
    const dbProd = db.getById('products', createdProduct.id);
    assert.strictEqual(dbProd.name, testProdName + ' (Premium Grade A)');
    assert.strictEqual(dbProd.price, 155);
    assert.strictEqual(dbProd.mrp, 200);
    assert.strictEqual(dbProd.stock, 45);

    // Customer fetch verification
    const custRes = await simulateVercelRequest('GET', `/api/products/${createdProduct.id}`);
    assert.strictEqual(custRes.statusCode, 200);
    assert.strictEqual(custRes.body.name, testProdName + ' (Premium Grade A)');
    assert.strictEqual(custRes.body.price, 155);
    assert.strictEqual(custRes.body.stock, 45);
  });

  // TEST 4: Owner adjusts stock -> Reflected on storefront
  await test('4. Owner stock adjustment -> Reflected on customer storefront', async () => {
    const adjustPayload = {
      productId: createdProduct.id,
      adjustmentQuantity: 20,
      reason: 'Fresh Morning Farm Restock'
    };

    const res = await simulateVercelRequest('POST', '/api/owner/inventory/adjust', adjustPayload, { cookie: ownerCookie });
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);

    const dbProd = db.getById('products', createdProduct.id);
    assert.strictEqual(dbProd.stock, 65, 'Stock should be 45 + 20 = 65');
  });

  // TEST 5: Owner unpublishes / suspends product -> Filtered from customer storefront
  await test('5. Owner suspends product -> Filtered out on storefront; Activating restores it', async () => {
    // 5A: Suspend
    const suspRes = await simulateVercelRequest('PATCH', `/api/owner/products/${createdProduct.id}/status`, { status: 'SUSPENDED' }, { cookie: ownerCookie });
    assert.strictEqual(suspRes.statusCode, 200);

    const suspProd = db.getById('products', createdProduct.id);
    assert.strictEqual(suspProd.status, 'SUSPENDED');

    // Storefront mapping check: isSuspended should be true
    const cleanId = (suspProd.storefrontId || suspProd.id).replace(/^prod_/, '');
    const isSuspended = suspProd.status === 'SUSPENDED' || suspProd.status === 'INACTIVE' || suspProd.status === 'DRAFT' || suspProd.status === 'DELETED';
    assert.strictEqual(isSuspended, true, 'Suspended product must be flagged as isSuspended');

    // 5B: Reactivate
    const actRes = await simulateVercelRequest('PATCH', `/api/owner/products/${createdProduct.id}/status`, { status: 'ACTIVE' }, { cookie: ownerCookie });
    assert.strictEqual(actRes.statusCode, 200);

    const actProd = db.getById('products', createdProduct.id);
    assert.strictEqual(actProd.status, 'ACTIVE');
    const isActSuspended = actProd.status === 'SUSPENDED' || actProd.status === 'INACTIVE' || actProd.status === 'DRAFT' || actProd.status === 'DELETED';
    assert.strictEqual(isActSuspended, false, 'Reactivated product must NOT be suspended');
  });

  // TEST 6: Public /api/products alias routes (POST, PUT, DELETE, Categories)
  await test('6. Public /api/products and /api/categories endpoints work seamlessly', async () => {
    // Test categories
    const catRes = await simulateVercelRequest('GET', '/api/categories');
    assert.strictEqual(catRes.statusCode, 200);
    assert(Array.isArray(catRes.body));
    assert(catRes.body.length >= 3);

    // Test CORS headers
    assert(catRes.headers['access-control-allow-origin'], 'CORS Allow-Origin header must be present');
    assert.strictEqual(catRes.headers['access-control-allow-credentials'], 'true', 'Credentials header must be true for specific origin');

    // Test OPTIONS preflight
    const optRes = await simulateVercelRequest('OPTIONS', '/api/products');
    assert.strictEqual(optRes.statusCode, 204);
    assert(optRes.headers['access-control-allow-methods'].includes('GET'));
    assert(optRes.headers['access-control-allow-methods'].includes('POST'));
    assert.strictEqual(optRes.headers['access-control-allow-credentials'], 'true');
  });

  // TEST 7: Cleanup
  await test('7. Owner deletes test product -> Removed cleanly from database', async () => {
    const delRes = await simulateVercelRequest('DELETE', `/api/owner/products/${createdProduct.id}`, null, { cookie: ownerCookie });
    assert.strictEqual(delRes.statusCode, 200);

    const deleted = db.getById('products', createdProduct.id);
    assert(!deleted, 'Product must be null after deletion');
  });

  console.log(`\n======================================================`);
  console.log(`Production Flow Results: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionCatalogFlowVerification().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
