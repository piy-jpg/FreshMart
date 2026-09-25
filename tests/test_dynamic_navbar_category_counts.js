/**
 * Test Suite: Dynamic Navbar Category Counts from PostgreSQL (Neon Production Architecture)
 * 
 * Tests the complete lifecycle:
 * 1. Record current navbar counts from PostgreSQL-backed API.
 * 2. Create one new published Vegetable product from Owner Panel.
 * 3. Verify PostgreSQL contains it.
 * 4. Verify navbar changes Vegetables from 49 -> 50.
 * 5. Change that product's category to Fruits.
 * 6. Verify navbar changes: Vegetables 50 -> 49, Fruits 19 -> 20.
 * 7. Suspend/archive the product.
 * 8. Verify Fruits 20 -> 19.
 * 9. Publish/restore it.
 * 10. Verify Fruits 19 -> 20.
 * 11. Refresh customer website and verify counts remain correct from PostgreSQL.
 * 12. Verify no hardcoded category counts remain in production code.
 * 13. Clean up test product.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { server } = require('../server');
const vercelApiHandler = require('../api/index');

class MockElement {
  constructor(tag = 'div', attributes = {}, text = '') {
    this.tagName = tag.toUpperCase();
    this.attributes = attributes;
    this.classList = {
      _classes: new Set((attributes.class || '').split(/\s+/).filter(Boolean)),
      contains(cls) { return this._classes.has(cls); },
      add(cls) { this._classes.add(cls); },
      remove(cls) { this._classes.delete(cls); }
    };
    this.children = [];
    this.childNodes = [];
    this._textContent = text;
  }

  get textContent() {
    if (this.children.length === 0) return this._textContent;
    return this.children.map(c => c.textContent).join(' ');
  }

  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
    this.childNodes = [{ nodeType: 3, textContent: String(val) }];
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, val) {
    this.attributes[name] = val;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const check = (node) => {
      if (node !== this) {
        if (selector.startsWith('a[href*="')) {
          const match = selector.match(/a\[href\*="([^"]+)"\]/);
          if (match && node.tagName === 'A' && (node.getAttribute('href') || '').includes(match[1])) {
            results.push(node);
          }
        } else if (selector === 'span:last-child') {
          if (node.tagName === 'SPAN') results.push(node);
        } else if (selector === '.rounded-full') {
          if (node.classList.contains('rounded-full')) results.push(node);
        } else if (selector === 'span, a') {
          if (node.tagName === 'SPAN' || node.tagName === 'A') results.push(node);
        } else if (selector === 'span') {
          if (node.tagName === 'SPAN') results.push(node);
        }
      }
      for (const child of node.children) {
        check(child);
      }
    };
    check(this);
    return results;
  }
}

// Build mock DOM matching customer store
const mockVegLink = new MockElement('a', { href: 'vegetables.html', class: 'px-3 py-1 rounded-full text-stone-600 hover:bg-stone-50 whitespace-nowrap' }, 'Vegetables');
const mockFruitLink = new MockElement('a', { href: 'fruits.html', class: 'px-3 py-1 rounded-full text-stone-600 hover:bg-stone-50 whitespace-nowrap' }, 'Fruits');
const mockGroceryLink = new MockElement('a', { href: 'grocery.html', class: 'px-3 py-1 rounded-full text-stone-600 hover:bg-stone-50 whitespace-nowrap' }, 'Grocery');
const mockOffersLink = new MockElement('a', { href: 'offers.html', class: 'px-3 py-1 rounded-full text-amber-700 bg-amber-50 font-bold whitespace-nowrap flex items-center gap-1' }, '✦ Offers');

// Sidebar link badges
const mockVegSidebarBadge = new MockElement('span', { class: 'text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full' }, 'Fresh');
const mockVegSidebar = new MockElement('a', { href: 'vegetables.html', class: 'sidebar-link group' });
mockVegSidebar.children.push(mockVegSidebarBadge);

const mockFruitSidebarBadge = new MockElement('span', { class: 'text-[9.5px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full' }, 'Orchard');
const mockFruitSidebar = new MockElement('a', { href: 'fruits.html', class: 'sidebar-link group' });
mockFruitSidebar.children.push(mockFruitSidebarBadge);

const mockGrocSidebarBadge = new MockElement('span', { class: 'text-[9.5px] font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full' }, 'Pantry');
const mockGrocSidebar = new MockElement('a', { href: 'grocery.html', class: 'sidebar-link group' });
mockGrocSidebar.children.push(mockGrocSidebarBadge);

const allMockElements = [
  mockVegLink, mockFruitLink, mockGroceryLink, mockOffersLink,
  mockVegSidebar, mockFruitSidebar, mockGrocSidebar
];

global.window = {
  __suspendedProductIds: new Set(),
  addEventListener: () => {},
  removeEventListener: () => {},
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
};
global.sessionStorage = global.window.sessionStorage;
global.localStorage = global.window.localStorage;
global.document = {
  getElementById: (id) => null,
  querySelectorAll: (selector) => {
    const matched = [];
    for (const el of allMockElements) {
      if (selector.startsWith('a[href*="')) {
        const match = selector.match(/a\[href\*="([^"]+)"\]/);
        if (match && el.tagName === 'A' && (el.getAttribute('href') || '').includes(match[1])) {
          matched.push(el);
        }
      } else if (selector === 'span, a') {
        if (el.tagName === 'SPAN' || el.tagName === 'A') matched.push(el);
        for (const c of el.children) {
          if (c.tagName === 'SPAN' || c.tagName === 'A') matched.push(c);
        }
      } else if (selector === 'span') {
        if (el.tagName === 'SPAN') matched.push(el);
        for (const c of el.children) {
          if (c.tagName === 'SPAN') matched.push(c);
        }
      }
    }
    return matched;
  },
  addEventListener: () => {}
};
global.cart = {};
global.wishlist = [];

// Load app.js logic into global scope
const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'customer-store', 'scripts', 'app.js'), 'utf8');
eval(appJsContent);

// Request helper simulating Vercel Serverless / HTTP handler
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
        try {
          parsed = JSON.parse(this.body);
        } catch (e) {
          parsed = this.body;
        }
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          data: parsed,
          text: this.body
        });
      }
    };

    if (body) {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      vercelApiHandler(req, res);
      req.emit('data', Buffer.from(payload));
      req.emit('end');
    } else {
      vercelApiHandler(req, res);
      req.emit('end');
    }
  });
}

async function runDynamicNavbarTests() {
  console.log('🥬 ======================================================================');
  console.log('🥬 FreshMart: Dynamic Navbar Category Counts from PostgreSQL Test Suite');
  console.log('🥬 ======================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(stepNum, name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] Step ${stepNum}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] Step ${stepNum}: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  let ownerCookie = '';
  let testProductId = '';

  // Auth owner
  const authRes = await simulateVercelRequest('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'password123'
  });
  assert.strictEqual(authRes.statusCode, 200, 'Owner login must succeed');
  if (authRes.headers['set-cookie']) {
    const rawCookie = Array.isArray(authRes.headers['set-cookie']) ? authRes.headers['set-cookie'][0] : authRes.headers['set-cookie'];
    ownerCookie = rawCookie.split(';')[0];
  }

  const applyCatalog = (data, trigger = true) => {
    if (typeof window.applyProductArrayToStorefront === 'function') {
      window.applyProductArrayToStorefront(data, trigger);
    } else if (typeof applyProductArrayToStorefront === 'function') {
      applyProductArrayToStorefront(data, trigger);
    }
  };

  // 1. Record current navbar counts
  let initialVeg = 0;
  let initialFruit = 0;
  let initialGroc = 0;

  await test(1, 'Record current navbar counts from production PostgreSQL API', async () => {
    const res = await simulateVercelRequest('GET', '/api/products');
    assert.strictEqual(res.statusCode, 200, 'GET /api/products must return 200');
    assert(Array.isArray(res.data), 'Products response must be an array');

    applyCatalog(res.data, true);

    const vegMatch = mockVegLink.textContent.match(/Vegetables\s*\((\d+)\)/);
    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const grocMatch = mockGroceryLink.textContent.match(/Grocery\s*\((\d+)\)/);

    assert(vegMatch, 'Vegetables link must have a count in parentheses');
    assert(fruitMatch, 'Fruits link must have a count in parentheses');
    assert(grocMatch, 'Grocery link must have a count in parentheses');

    initialVeg = parseInt(vegMatch[1], 10);
    initialFruit = parseInt(fruitMatch[1], 10);
    initialGroc = parseInt(grocMatch[1], 10);

    console.log(`     Baseline Counts -> Vegetables: (${initialVeg}), Fruits: (${initialFruit}), Grocery: (${initialGroc})`);
    assert(initialVeg >= 40, 'Vegetables initial count should be >= 40 (baseline 49)');
    assert(initialFruit >= 15, 'Fruits initial count should be >= 15 (baseline 19)');
    assert(initialGroc >= 15, 'Grocery initial count should be >= 15 (baseline 19)');
  });

  // 2 & 3. Create one new published Vegetable product from Owner Panel
  await test('2 & 3', 'Create one new published Vegetable product in Owner Panel & verify PostgreSQL contains it', async () => {
    const uniqueSuffix = Date.now();
    const newProductPayload = {
      name: `Hydroponic Butter Lettuce ${uniqueSuffix}`,
      category: 'Vegetables',
      subcategory: 'Leafy Greens',
      price: 65,
      mrp: 90,
      stock: 50,
      unit: '1 head (250g)',
      status: 'ACTIVE',
      farmer: 'Nilgiri Hydroponic Farms'
    };

    const createRes = await simulateVercelRequest('POST', '/api/owner/products', newProductPayload, {
      cookie: ownerCookie
    });
    assert.strictEqual(createRes.statusCode, 201, 'Owner product creation must return 201 Created');
    assert(createRes.data && createRes.data.product, 'Response must contain created product');

    testProductId = createRes.data.product.id;
    assert(testProductId, 'Created product must have an id');

    // Verify PostgreSQL single source of truth has it
    const dbProd = db.getById('products', testProductId);
    assert(dbProd, 'Database must contain the newly created product');
    assert.strictEqual(dbProd.category, 'Vegetables', 'Product category in database must be Vegetables');
    assert.strictEqual(dbProd.status, 'ACTIVE', 'Product status in database must be ACTIVE');
  });

  // 4. Verify navbar changes Vegetables from N -> N + 1
  await test(4, `Verify navbar changes Vegetables from (${initialVeg}) -> (${initialVeg + 1})`, async () => {
    const res = await simulateVercelRequest('GET', '/api/products');
    applyCatalog(res.data, true);

    const vegMatch = mockVegLink.textContent.match(/Vegetables\s*\((\d+)\)/);
    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const currentVeg = parseInt(vegMatch[1], 10);
    const currentFruit = parseInt(fruitMatch[1], 10);

    console.log(`     After Add -> Navbar shows: ${mockVegLink.textContent}, ${mockFruitLink.textContent}`);
    assert.strictEqual(currentVeg, initialVeg + 1, `Vegetables navbar count must be ${initialVeg + 1}`);
    assert.strictEqual(currentFruit, initialFruit, `Fruits navbar count must remain ${initialFruit}`);
  });

  // 5 & 6. Change that product's category to Fruits
  await test('5 & 6', `Change product category to Fruits -> Verify Vegetables (${initialVeg + 1} -> ${initialVeg}) and Fruits (${initialFruit} -> ${initialFruit + 1})`, async () => {
    const updateRes = await simulateVercelRequest('PUT', `/api/owner/products/${encodeURIComponent(testProductId)}`, {
      category: 'Fruits',
      subcategory: 'Exotic Berries'
    }, {
      cookie: ownerCookie
    });
    assert.strictEqual(updateRes.statusCode, 200, 'Update product category must return 200 OK');

    // Verify DB update
    const dbProd = db.getById('products', testProductId);
    assert.strictEqual(dbProd.category, 'Fruits', 'Product category in DB must now be Fruits');

    const res = await simulateVercelRequest('GET', '/api/products');
    applyCatalog(res.data, true);

    const vegMatch = mockVegLink.textContent.match(/Vegetables\s*\((\d+)\)/);
    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const currentVeg = parseInt(vegMatch[1], 10);
    const currentFruit = parseInt(fruitMatch[1], 10);

    console.log(`     After Category Change -> Navbar shows: ${mockVegLink.textContent}, ${mockFruitLink.textContent}`);
    assert.strictEqual(currentVeg, initialVeg, `Vegetables count must decrement back to ${initialVeg}`);
    assert.strictEqual(currentFruit, initialFruit + 1, `Fruits count must increment to ${initialFruit + 1}`);
  });

  // 7 & 8. Suspend/archive the product -> Verify Fruits count decrements
  await test('7 & 8', `Suspend/archive product -> Verify Fruits (${initialFruit + 1} -> ${initialFruit})`, async () => {
    const suspendRes = await simulateVercelRequest('PATCH', `/api/owner/products/${encodeURIComponent(testProductId)}/status`, {
      status: 'SUSPENDED'
    }, {
      cookie: ownerCookie
    });
    assert.strictEqual(suspendRes.statusCode, 200, 'Suspend product must return 200 OK');

    const dbProd = db.getById('products', testProductId);
    assert.strictEqual(dbProd.status, 'SUSPENDED', 'Product status in DB must be SUSPENDED');

    const res = await simulateVercelRequest('GET', '/api/products');
    applyCatalog(res.data, true);

    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const currentFruit = parseInt(fruitMatch[1], 10);

    console.log(`     After Suspend -> Navbar shows: ${mockFruitLink.textContent}`);
    assert.strictEqual(currentFruit, initialFruit, `Suspended product must not count in navbar: Fruits must be ${initialFruit}`);
  });

  // 9 & 10. Publish/restore it -> Verify Fruits count increments
  await test('9 & 10', `Publish/restore product -> Verify Fruits (${initialFruit} -> ${initialFruit + 1})`, async () => {
    const activateRes = await simulateVercelRequest('PATCH', `/api/owner/products/${encodeURIComponent(testProductId)}/status`, {
      status: 'ACTIVE'
    }, {
      cookie: ownerCookie
    });
    assert.strictEqual(activateRes.statusCode, 200, 'Activate product must return 200 OK');

    const dbProd = db.getById('products', testProductId);
    assert.strictEqual(dbProd.status, 'ACTIVE', 'Product status in DB must be ACTIVE');

    const res = await simulateVercelRequest('GET', '/api/products');
    applyCatalog(res.data, true);

    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const currentFruit = parseInt(fruitMatch[1], 10);

    console.log(`     After Restore -> Navbar shows: ${mockFruitLink.textContent}`);
    assert.strictEqual(currentFruit, initialFruit + 1, `Restored product must count in navbar: Fruits must be ${initialFruit + 1}`);
  });

  // 11. Refresh customer website and verify counts remain correct
  await test(11, 'Simulate full page refresh & verify navbar counts fetched again from PostgreSQL-backed API', async () => {
    // Fresh session simulate: clear in-memory arrays and reload from /api/products
    global.allVegetablesData = [];
    global.allFruitsData = [];
    global.allGroceryData = [];
    global.window.__suspendedProductIds.clear();

    const refreshRes = await simulateVercelRequest('GET', '/api/products?_t=' + Date.now());
    assert.strictEqual(refreshRes.statusCode, 200, 'Page refresh GET /api/products must return 200 OK');

    applyCatalog(refreshRes.data, true);

    const vegMatch = mockVegLink.textContent.match(/Vegetables\s*\((\d+)\)/);
    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const grocMatch = mockGroceryLink.textContent.match(/Grocery\s*\((\d+)\)/);

    const currentVeg = parseInt(vegMatch[1], 10);
    const currentFruit = parseInt(fruitMatch[1], 10);
    const currentGroc = parseInt(grocMatch[1], 10);

    console.log(`     Refreshed Page Navbar -> Vegetables: (${currentVeg}), Fruits: (${currentFruit}), Grocery: (${currentGroc})`);
    assert.strictEqual(currentVeg, initialVeg, 'Vegetables count after refresh must match PostgreSQL state');
    assert.strictEqual(currentFruit, initialFruit + 1, 'Fruits count after refresh must match PostgreSQL state');
    assert.strictEqual(currentGroc, initialGroc, 'Grocery count after refresh must match PostgreSQL state');
  });

  // 12. Verify no hardcoded category counts remain in production HTML code
  await test(12, 'Verify no hardcoded category counts remain in production HTML code', async () => {
    const htmlFiles = [
      'index.html',
      'vegetables.html',
      'fruits.html',
      'grocery.html',
      'offers.html',
      'product-details.html',
      'frontend/customer-store/index.html',
      'frontend/customer-store/vegetables.html',
      'frontend/customer-store/fruits.html',
      'frontend/customer-store/grocery.html',
      'frontend/customer-store/offers.html',
      'frontend/customer-store/product-details.html'
    ];

    for (const relPath of htmlFiles) {
      const fullPath = path.join(__dirname, '..', relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert(!content.includes('Vegetables (49)'), `${relPath} must not contain hardcoded "Vegetables (49)"`);
      assert(!content.includes('Fruits (19)'), `${relPath} must not contain hardcoded "Fruits (19)"`);
      assert(!content.includes('Grocery (19)'), `${relPath} must not contain hardcoded "Grocery (19)"`);
    }
  });

  // Clean up: delete test product
  await test('13 (Cleanup)', 'Clean up test product from PostgreSQL and verify baseline restored', async () => {
    const delRes = await simulateVercelRequest('DELETE', `/api/owner/products/${encodeURIComponent(testProductId)}`, null, {
      cookie: ownerCookie
    });
    assert.strictEqual(delRes.statusCode, 200, 'DELETE test product must return 200 OK');

    const res = await simulateVercelRequest('GET', '/api/products');
    applyCatalog(res.data, true);

    const vegMatch = mockVegLink.textContent.match(/Vegetables\s*\((\d+)\)/);
    const fruitMatch = mockFruitLink.textContent.match(/Fruits\s*\((\d+)\)/);
    const grocMatch = mockGroceryLink.textContent.match(/Grocery\s*\((\d+)\)/);

    const finalVeg = parseInt(vegMatch[1], 10);
    const finalFruit = parseInt(fruitMatch[1], 10);
    const finalGroc = parseInt(grocMatch[1], 10);

    console.log(`     Final Restored Navbar -> Vegetables: (${finalVeg}), Fruits: (${finalFruit}), Grocery: (${finalGroc})`);
    assert.strictEqual(finalVeg, initialVeg, `Vegetables final count must be ${initialVeg}`);
    assert.strictEqual(finalFruit, initialFruit, `Fruits final count must be ${initialFruit}`);
    assert.strictEqual(finalGroc, initialGroc, `Grocery final count must be ${initialGroc}`);
  });

  console.log('\n======================================================================');
  console.log(`🎉 Test Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDynamicNavbarTests().catch(err => {
  console.error('Fatal Test Execution Error:', err);
  process.exit(1);
});
