/**
 * SabjiHub Product Catalog Actions Verification Suite
 * Verifies Add, Edit, Suspend/Activate, and View capabilities for both Owner and Admin roles.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../database');
const server = require('../server');

async function runProductsVerification() {
  console.log('🥬 Starting SabjiHub Products Catalog Actions Verification...\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
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

  // Helper mock request/response handler
  function simulateRequest(method, urlPath, body = null, cookie = null) {
    return new Promise((resolve) => {
      const EventEmitter = require('events');
      const req = new EventEmitter();
      req.method = method;
      req.url = urlPath;
      req.headers = {
        host: 'localhost:8080',
        'content-type': 'application/json'
      };
      if (cookie) req.headers.cookie = cookie;

      const res = {
        statusCode: 200,
        headers: {},
        body: '',
        getHeader(name) { return this.headers[name.toLowerCase()]; },
        setHeader(name, val) { this.headers[name.toLowerCase()] = val; },
        writeHead(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(this.headers, hdrs); },
        end(chunk) {
          if (chunk) this.body += chunk;
          let parsed = null;
          try { parsed = JSON.parse(this.body); } catch (e) { parsed = this.body; }
          resolve({ statusCode: this.statusCode, headers: this.headers, body: parsed });
        }
      };

      // Dispatch to server's request handler
      setImmediate(() => {
        server.server.emit('request', req, res);
        if (body) {
          req.emit('data', Buffer.from(JSON.stringify(body)));
        }
        req.emit('end');
      });
    });
  }

  // 1. Owner Session Creation
  const owner = db.ensureOwnerUser('piyushverma730929@gmail.com');
  const session = db.createSession(owner.id, true);
  const ownerCookie = `sjh_session=${session.id}`;

  // ----------------------------------------------------
  // TEST 1: Catalog items count
  // ----------------------------------------------------
  test('1. Master catalog populated with full produce registry', () => {
    const products = db.getAll('products');
    assert(products.length >= 57, `Master catalog must have at least 57 products, found: ${products.length}`);
  });

  // ----------------------------------------------------
  // TEST 2: Owner Add Produce (POST /api/owner/products)
  // ----------------------------------------------------
  let createdProductId = null;
  await asyncTest('2. Owner Add Produce: Create new item with full metadata & inward movement', async () => {
    const payload = {
      name: 'Organic Shimla Apple',
      hindiName: 'शिमला सेब',
      category: 'Fruits',
      subcategory: 'Crisp Apples',
      unit: '1 kg',
      price: 180,
      mrp: 220,
      costPrice: 115,
      stock: 75,
      lowStockLimit: 20,
      farmer: 'Kinnaur Highlands Apple Orchards, HP',
      freshnessDays: 14,
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80',
      description: 'Mountain-chilled, naturally sweetened royal delicious apples from high-altitude slopes.'
    };

    const res = await simulateRequest('POST', '/api/owner/products', payload, ownerCookie);
    assert.strictEqual(res.statusCode, 201, `Expected 201 Created, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert(res.body.success, 'Response must indicate success');
    assert(res.body.product, 'Response must return created product');
    
    const prod = res.body.product;
    createdProductId = prod.id;
    assert.strictEqual(prod.name, 'Organic Shimla Apple');
    assert.strictEqual(prod.hindiName, 'शिमला सेब');
    assert.strictEqual(prod.price, 180);
    assert.strictEqual(prod.costPrice, 115);
    assert.strictEqual(prod.stock, 75);
    assert(prod.sku.startsWith('SJH-FRU-ORG-'), `Expected SKU prefix SJH-FRU-ORG-, got ${prod.sku}`);

    // Verify Inward Inventory Movement was logged
    const movements = db.getAll('inventory_movements') || [];
    const move = movements.find(m => m.productId === prod.id);
    assert(move, 'Inward inventory movement must be recorded on catalog add');
    assert.strictEqual(move.quantity, 75);
    assert.strictEqual(move.after, 75);
  });

  // ----------------------------------------------------
  // TEST 3: Owner Edit Produce (PUT /api/owner/products/:id)
  // ----------------------------------------------------
  await asyncTest('3. Owner Edit Produce: Update price, stock, specs and margins', async () => {
    assert(createdProductId, 'createdProductId must exist');
    const updatePayload = {
      name: 'Organic Shimla Apple (Royal Delicious)',
      hindiName: 'शाही शिमला सेब',
      price: 195,
      mrp: 240,
      costPrice: 120,
      stock: 85,
      lowStockLimit: 25,
      description: 'Updated fresh harvest notes.'
    };

    const res = await simulateRequest('PUT', `/api/owner/products/${createdProductId}`, updatePayload, ownerCookie);
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    assert(res.body.success, 'Response must indicate success');
    
    const updated = db.getById('products', createdProductId);
    assert.strictEqual(updated.name, 'Organic Shimla Apple (Royal Delicious)');
    assert.strictEqual(updated.hindiName, 'शाही शिमला सेब');
    assert.strictEqual(updated.price, 195);
    assert.strictEqual(updated.costPrice, 120);
    assert.strictEqual(updated.stock, 85);
    assert.strictEqual(updated.lowStockLimit, 25);
  });

  // ----------------------------------------------------
  // TEST 4: Owner Suspend / Activate Toggle (PATCH /api/owner/products/:id/status)
  // ----------------------------------------------------
  await asyncTest('4. Owner Suspend Produce: Toggle status to SUSPENDED', async () => {
    const res = await simulateRequest('PATCH', `/api/owner/products/${createdProductId}/status`, { status: 'SUSPENDED' }, ownerCookie);
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);
    
    const prod = db.getById('products', createdProductId);
    assert.strictEqual(prod.status, 'SUSPENDED', 'Product status must be SUSPENDED');
  });

  await asyncTest('5. Owner Activate Produce: Toggle status back to ACTIVE', async () => {
    const res = await simulateRequest('PATCH', `/api/owner/products/${createdProductId}/status`, { status: 'ACTIVE' }, ownerCookie);
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);
    
    const prod = db.getById('products', createdProductId);
    assert.strictEqual(prod.status, 'ACTIVE', 'Product status must be ACTIVE');
  });

  // ----------------------------------------------------
  // TEST 6: Owner Delete Produce (DELETE /api/owner/products/:id)
  // ----------------------------------------------------
  await asyncTest('6. Owner Delete Produce: Remove SKU from catalog', async () => {
    const res = await simulateRequest('DELETE', `/api/owner/products/${createdProductId}`, null, ownerCookie);
    assert.strictEqual(res.statusCode, 200, `Expected 200 OK, got ${res.statusCode}`);
    
    const deleted = db.getById('products', createdProductId);
    assert(!deleted, 'Product must be null after deletion');
  });

  // ----------------------------------------------------
  // TEST 7: Frontend UI Integrity Check for owner.html
  // ----------------------------------------------------
  test('7. owner.html has complete Add, Edit, Suspend, and View modal markup & handlers', () => {
    const ownerPath = fs.existsSync(path.join(__dirname, '..', 'frontend', 'owner-dashboard', 'owner.html'))
      ? path.join(__dirname, '..', 'frontend', 'owner-dashboard', 'owner.html')
      : path.join(__dirname, '..', 'owner.html');
    const ownerHtml = fs.readFileSync(ownerPath, 'utf8');
    
    // Check Modal Elements
    assert(ownerHtml.includes('id="modal-view-product"'), 'owner.html must contain modal-view-product');
    assert(ownerHtml.includes('id="modal-edit-product"'), 'owner.html must contain modal-edit-product');
    assert(ownerHtml.includes('id="modal-add-product"'), 'owner.html must contain modal-add-product');
    assert(ownerHtml.includes('id="view-prod-margin"'), 'owner.html must contain margin element in view modal');
    assert(ownerHtml.includes('id="view-prod-physical-stock"'), 'owner.html must contain physical stock in view modal');
    assert(ownerHtml.includes('id="view-prod-available-stock"'), 'owner.html must contain available stock in view modal');

    // Check JS Functions
    assert(ownerHtml.includes('function viewProduct('), 'owner.html must define viewProduct()');
    assert(ownerHtml.includes('function closeViewProductModal('), 'owner.html must define closeViewProductModal()');
    assert(ownerHtml.includes('function openEditProductModal('), 'owner.html must define openEditProductModal()');
    assert(ownerHtml.includes('function closeEditProductModal('), 'owner.html must define closeEditProductModal()');
    assert(ownerHtml.includes('function submitEditProduct('), 'owner.html must define submitEditProduct()');
    assert(ownerHtml.includes('function toggleProductSuspend('), 'owner.html must define toggleProductSuspend()');
    assert(ownerHtml.includes('function toggleProductSuspendFromView('), 'owner.html must define toggleProductSuspendFromView()');
    assert(ownerHtml.includes('function editProductFromView('), 'owner.html must define editProductFromView()');
    assert(ownerHtml.includes('function handleProductsSearch('), 'owner.html must define handleProductsSearch()');
    assert(ownerHtml.includes('function handleProductsCategoryFilter('), 'owner.html must define handleProductsCategoryFilter()');
  });

  // ----------------------------------------------------
  // TEST 8: Frontend UI Integrity Check for admin.html
  // ----------------------------------------------------
  test('8. admin.html has complete View and Suspend actions & modal', () => {
    const adminPath = fs.existsSync(path.join(__dirname, '..', 'frontend', 'owner-dashboard', 'admin.html'))
      ? path.join(__dirname, '..', 'frontend', 'owner-dashboard', 'admin.html')
      : path.join(__dirname, '..', 'admin.html');
    const adminHtml = fs.readFileSync(adminPath, 'utf8');
    
    assert(adminHtml.includes('id="view-product-modal"'), 'admin.html must contain view-product-modal');
    assert(adminHtml.includes('id="product-modal"'), 'admin.html must contain product-modal');
    assert(adminHtml.includes('function viewProduct('), 'admin.html must define viewProduct()');
    assert(adminHtml.includes('function toggleSuspendProduct('), 'admin.html must define toggleSuspendProduct()');
  });

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runProductsVerification().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
