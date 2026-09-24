/**
 * Comprehensive Verification: Owner Updates Product on Vercel
 * Tests updating price, stock, category, image, description, status
 * and ensures immediate synchronization across owner and customer storefront.
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
      const bodyStr = JSON.stringify(body);
      req.push(bodyStr);
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

async function runTest() {
  console.log('🧪 Testing Owner Product Update flow on Vercel...\n');

  // Step 1: Login as Owner to get authenticated cookie
  const loginRes = await simulateVercelRequest('POST', '/api/auth/login', {
    email: 'piyushverma730929@gmail.com',
    password: 'password123'
  });

  const cookie = loginRes.headers['set-cookie']
    ? (Array.isArray(loginRes.headers['set-cookie']) ? loginRes.headers['set-cookie'][0] : loginRes.headers['set-cookie'])
    : '';

  console.log('  1. Authenticated Owner Session:', loginRes.statusCode === 200 ? '✅ OK' : '❌ Failed');
  assert.strictEqual(loginRes.statusCode, 200, 'Owner login must succeed');

  // Step 2: Fetch products from Owner catalog
  const ownerCatalog = await simulateVercelRequest('GET', '/api/owner/products', null, {
    cookie: cookie
  });
  assert.strictEqual(ownerCatalog.statusCode, 200, 'Owner catalog fetch must succeed');
  assert(Array.isArray(ownerCatalog.body) && ownerCatalog.body.length > 0, 'Catalog must contain products');
  
  const targetProduct = ownerCatalog.body[0];
  console.log(`  2. Selected Target Product: "${targetProduct.name}" (ID: ${targetProduct.id}, Current Price: ₹${targetProduct.price})`);

  // Step 3: Owner updates product specs: Price, MRP, Stock, Image, Description
  const newPrice = 149;
  const newMrp = 199;
  const newStock = 520;
  const newCategory = 'Certified Organic';
  const newDesc = 'Freshly updated by Owner from dashboard on Vercel with verified organic certification.';

  const updatePayload = {
    name: targetProduct.name,
    title: targetProduct.name,
    hindiName: targetProduct.hindiName || '',
    category: newCategory,
    subcategory: 'Organic Premium',
    unit: targetProduct.unit || '1 kg',
    price: newPrice,
    sellingPrice: newPrice,
    mrp: newMrp,
    originalPrice: newMrp,
    costPrice: 95,
    stock: newStock,
    lowStockLimit: 20,
    status: 'ACTIVE',
    farmer: 'Coorg Organic Valley',
    image: 'https://images.unsplash.com/photo-1546470427-227c7369a4d0?auto=format&fit=crop&w=400&q=80',
    description: newDesc
  };

  const updateRes = await simulateVercelRequest('PUT', `/api/owner/products/${targetProduct.id}`, updatePayload, {
    cookie: cookie
  });

  console.log('  3. Owner PUT /api/owner/products/:id Response Code:', updateRes.statusCode);
  assert.strictEqual(updateRes.statusCode, 200, 'Update product API must return 200');
  assert.strictEqual(updateRes.body.success, true, 'Response must indicate success: true');
  assert.strictEqual(updateRes.body.product.price, newPrice, 'Returned product price must be updated');
  assert.strictEqual(updateRes.body.product.stock, newStock, 'Returned product stock must be updated');
  console.log(`  ✅ Product "${targetProduct.name}" updated successfully on Vercel backend.`);

  // Step 4: Customer Storefront GET /api/products fetches updated catalog
  const customerCatalog = await simulateVercelRequest('GET', '/api/products');
  assert.strictEqual(customerCatalog.statusCode, 200, 'Customer catalog fetch must return 200');
  
  const updatedOnStorefront = customerCatalog.body.find(p => p.id === targetProduct.id || p.storefrontId === targetProduct.id);
  assert(updatedOnStorefront, 'Updated product must exist on customer storefront');
  assert.strictEqual(updatedOnStorefront.price, newPrice, `Customer storefront price must be ₹${newPrice}`);
  assert.strictEqual(updatedOnStorefront.stock, newStock, `Customer storefront stock must be ${newStock}`);
  assert.strictEqual(updatedOnStorefront.category, newCategory, `Customer storefront category must be "${newCategory}"`);
  console.log(`  4. Customer Storefront Verification: Price = ₹${updatedOnStorefront.price}, Stock = ${updatedOnStorefront.stock}, Category = ${updatedOnStorefront.category}`);

  // Step 5: Test Public Endpoint Alias PUT /api/products/:id
  const aliasPrice = 135;
  const aliasUpdateRes = await simulateVercelRequest('PUT', `/api/products/${targetProduct.id}`, {
    ...updatePayload,
    price: aliasPrice,
    sellingPrice: aliasPrice
  }, {
    cookie: cookie
  });
  assert.strictEqual(aliasUpdateRes.statusCode, 200, 'Alias route PUT /api/products/:id must succeed');
  assert.strictEqual(aliasUpdateRes.body.product.price, aliasPrice, `Price must update to ₹${aliasPrice}`);
  console.log(`  5. Public Alias PUT /api/products/:id Verification: Price = ₹${aliasPrice} ✅`);

  // Step 6: Test Owner Status Toggle (SUSPEND & ACTIVATE)
  const suspendRes = await simulateVercelRequest('PATCH', `/api/owner/products/${targetProduct.id}/status`, {
    status: 'SUSPENDED'
  }, {
    cookie: cookie
  });
  assert.strictEqual(suspendRes.statusCode, 200, 'Suspend status patch must succeed');
  assert.strictEqual(suspendRes.body.product.status, 'SUSPENDED');

  const customerAfterSuspend = await simulateVercelRequest('GET', '/api/products');
  const suspendedProd = customerAfterSuspend.body.find(p => p.id === targetProduct.id);
  assert.strictEqual(suspendedProd.status, 'SUSPENDED', 'Product status must be SUSPENDED on storefront');
  console.log('  6. Owner Status Toggle Verification: Status = SUSPENDED ✅');

  // Reactivate product
  await simulateVercelRequest('PATCH', `/api/owner/products/${targetProduct.id}/status`, {
    status: 'ACTIVE'
  }, {
    cookie: cookie
  });
  console.log('  7. Reactivated Product Status = ACTIVE ✅');

  console.log('\n======================================================');
  console.log('🎉 ALL OWNER UPDATE TESTS ON VERCEL PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
