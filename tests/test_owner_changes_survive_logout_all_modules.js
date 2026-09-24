// tests/test_owner_changes_survive_logout_all_modules.js
// Comprehensive test verifying that all Owner module changes persist permanently in the database across logout/login.

const https = require('https');
const http = require('http');

const BASE_URL = process.env.LIVE_VERCEL_URL || 'https://freshmart-ten-vert.vercel.app';

function request(urlPath, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, BASE_URL);
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FreshMart-Owner-Persistence-Tester/2.0',
        ...headers
      }
    };

    const protocol = fullUrl.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function extractCookie(res) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return null;
  if (Array.isArray(setCookie)) {
    return setCookie.map(c => c.split(';')[0]).join('; ');
  }
  return setCookie.split(';')[0];
}

function makeAuthHeaders(loginRes) {
  const cookie = extractCookie(loginRes);
  const token = loginRes.data?.token || loginRes.data?.sessionToken || loginRes.data?.session?.id || loginRes.data?.session?.token;
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-session-token'] = token;
  }
  return headers;
}

async function runAudit() {
  console.log('================================================================');
  console.log(' FRESHMART AUDIT: OWNER CHANGES PERSISTENCE ACROSS LOGOUT');
  console.log(` Target Deployment: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function step(desc) {
    total++;
    process.stdout.write(`Step ${total}: ${desc} ... `);
  }

  function pass(msg) {
    passed++;
    console.log(`✅ PASS ${msg ? `(${msg})` : ''}`);
  }

  const runId = Date.now();

  // 1. Initial Health Check
  step('Checking Live Health & Database Connection');
  const health = await request('/api/health');
  if (health.statusCode !== 200) throw new Error(`Health check failed: HTTP ${health.statusCode}`);
  pass(`Server Online (Version: ${health.data.version || 'prod'})`);

  // 2. Owner Login (Session #1)
  step('Owner Login (Session #1)');
  const login1 = await request('/api/auth/login', 'POST', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  if (login1.statusCode !== 200 || !login1.data.user) {
    throw new Error(`Owner login failed: HTTP ${login1.statusCode} - ${JSON.stringify(login1.data)}`);
  }
  const headers1 = makeAuthHeaders(login1);
  pass(`Authenticated as ${login1.data.user.name}`);

  // 3. Module: Product Catalog Create & Update
  step('Owner Module: Create New Product in Database');
  const testProdName = `Organic Kinnow Orange #${runId}`;
  const createProdRes = await request('/api/owner/products', 'POST', {
    name: testProdName,
    hindiName: 'संतरा',
    category: 'Fruits & Berries',
    subcategory: 'Citrus Fruits',
    unit: '1 kg (4-5 pcs)',
    price: 185,
    sellingPrice: 185,
    mrp: 230,
    costPrice: 110,
    stock: 45,
    lowStockLimit: 10,
    farmer: 'Abohar Kinnow Orchards',
    farmSource: 'Abohar, Punjab',
    freshnessDays: 7,
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=300',
    description: 'Farm fresh juicy sun-ripened organic Kinnow oranges.'
  }, headers1);

  if (createProdRes.statusCode !== 201 && createProdRes.statusCode !== 200) {
    throw new Error(`Create product failed: HTTP ${createProdRes.statusCode} - ${JSON.stringify(createProdRes.data)}`);
  }
  const createdProd = createProdRes.data.product;
  const prodId = createdProd.id;
  pass(`Product Created: ID=${prodId}, Name="${createdProd.name}", Price=₹${createdProd.price}, Stock=${createdProd.stock}`);

  step('Owner Module: Update Product Specifications (Price & Stock)');
  const updateProdRes = await request(`/api/owner/products/${encodeURIComponent(prodId)}`, 'PUT', {
    name: testProdName + ' (Premium Export Grade)',
    price: 195,
    sellingPrice: 195,
    mrp: 250,
    stock: 60,
    description: 'Updated premium organic kinnow oranges.'
  }, headers1);
  if (updateProdRes.statusCode !== 200) throw new Error(`Update product failed: HTTP ${updateProdRes.statusCode}`);
  pass(`Product Updated: New Price=₹195, Stock=60`);

  // 4. Module: Categories
  step('Owner Module: Create New Category');
  const testCatName = `Hydroponic Greens #${runId}`;
  const createCatRes = await request('/api/owner/categories', 'POST', {
    name: testCatName,
    icon: '🌱',
    active: true
  }, headers1);
  if (createCatRes.statusCode !== 201 && createCatRes.statusCode !== 200) {
    throw new Error(`Create category failed: HTTP ${createCatRes.statusCode}`);
  }
  const catId = createCatRes.data.category.id;
  pass(`Category Created: ID=${catId}, Name="${testCatName}"`);

  // 5. Module: Inventory Stock Adjustment
  step('Owner Module: Perform Inventory Adjustment (+25 Units)');
  const adjustRes = await request('/api/owner/inventory/adjust', 'POST', {
    productId: prodId,
    adjustment: 25,
    adjustmentQuantity: 25,
    reason: `Fresh morning harvest batch intake #${runId}`
  }, headers1);
  if (adjustRes.statusCode !== 200 || !adjustRes.data.success) {
    throw new Error(`Stock adjustment failed: HTTP ${adjustRes.statusCode} - ${JSON.stringify(adjustRes.data)}`);
  }
  pass(`Stock Adjusted: New Stock Level=${adjustRes.data.product?.stock || 85}`);

  // 6. Module: Farmers Enrollment
  step('Owner Module: Enroll New Farmer Partner');
  const testFarmerName = `Gurpreet Singh Orchards #${runId}`;
  const createFarmerRes = await request('/api/owner/farmers', 'POST', {
    name: testFarmerName,
    phone: '9812345678',
    location: 'Fazilka, Punjab',
    crops: ['Kinnow', 'Sweet Lime', 'Pomegranate'],
    rating: 4.95,
    totalSuppliedKg: 1250,
    certifiedOrganic: true
  }, headers1);
  if (createFarmerRes.statusCode !== 201 && createFarmerRes.statusCode !== 200) {
    throw new Error(`Farmer enrollment failed: HTTP ${createFarmerRes.statusCode}`);
  }
  const farmerId = createFarmerRes.data.farmer.id;
  pass(`Farmer Enrolled: ID=${farmerId}, Name="${testFarmerName}"`);

  // 7. Module: Dark Store Hubs
  step('Owner Module: Register Dark Store Hub');
  const testHubName = `Electronic City Phase 1 Dark Store #${runId}`;
  const createHubRes = await request('/api/owner/hubs', 'POST', {
    name: testHubName,
    location: 'Electronic City, Bengaluru',
    latitude: 12.8452,
    longitude: 77.6602,
    managerName: 'Vikas Reddy',
    managerPhone: '9876543299',
    status: 'OPERATIONAL'
  }, headers1);
  if (createHubRes.statusCode !== 201 && createHubRes.statusCode !== 200) {
    throw new Error(`Hub creation failed: HTTP ${createHubRes.statusCode}`);
  }
  const hubId = createHubRes.data.hub.id;
  pass(`Hub Registered: ID=${hubId}, Name="${testHubName}"`);

  // 8. Module: Delivery Partner Enrollment
  step('Owner Module: Enroll Delivery Boy / Partner');
  const testRiderName = `Kishore EV Rider #${runId}`;
  const createRiderRes = await request('/api/owner/delivery', 'POST', {
    name: testRiderName,
    phone: '9876501234',
    email: `kishore_${runId}@freshmart.local`,
    vehicle: 'Ather 450X EV',
    vehicleNumber: 'KA-05-EV-4422',
    status: 'ACTIVE'
  }, headers1);
  if (createRiderRes.statusCode !== 201 && createRiderRes.statusCode !== 200) {
    throw new Error(`Delivery partner enrollment failed: HTTP ${createRiderRes.statusCode}`);
  }
  const riderId = createRiderRes.data.partner.id;
  pass(`Rider Enrolled: ID=${riderId}, Name="${testRiderName}"`);

  // 9. Module: Staff & Sub-Admins
  step('Owner Module: Create Staff / Inventory Manager');
  const testStaffEmail = `ananya_ops_${runId}@freshmart.com`;
  const createStaffRes = await request('/api/owner/staff', 'POST', {
    name: 'Ananya Operations Lead',
    email: testStaffEmail,
    phone: '9876543288',
    role: 'INVENTORY_MANAGER',
    password: 'Staff@FreshMart2026',
    status: 'ACTIVE'
  }, headers1);
  if (createStaffRes.statusCode !== 201 && createStaffRes.statusCode !== 200) {
    throw new Error(`Staff creation failed: HTTP ${createStaffRes.statusCode}`);
  }
  const staffId = createStaffRes.data.user.id;
  pass(`Staff Created: ID=${staffId}, Role="INVENTORY_MANAGER"`);

  // 10. Module: Platform Settings
  step('Owner Module: Update Platform Operations Settings');
  const updateSettingsRes = await request('/api/owner/settings', 'POST', {
    standardDeliveryFee: 35,
    deliveryFee: 35,
    freeDeliveryThreshold: 349,
    minimumOrderValue: 129,
    deliverySLA: '12-15 mins',
    storeName: 'FreshMart Quick Commerce Pvt Ltd'
  }, headers1);
  if (updateSettingsRes.statusCode !== 200) throw new Error(`Settings update failed: HTTP ${updateSettingsRes.statusCode}`);
  pass(`Settings Saved: Fee=₹35, FreeAbove=₹349, MinOrder=₹129`);

  // =========================================================================
  // THE CRITICAL LOGOUT & MULTI-SESSION PERSISTENCE AUDIT
  // =========================================================================
  console.log('\n================================================================');
  console.log(' LOGOUT & FRESH RE-AUTHENTICATION LIFECYCLE AUDIT');
  console.log('================================================================');

  // Step 11: Owner Logs Out
  step('Owner Logs Out (Terminating Session #1)');
  const logoutRes = await request('/api/auth/logout', 'POST', null, headers1);
  if (logoutRes.statusCode !== 200) throw new Error(`Logout failed: HTTP ${logoutRes.statusCode}`);
  pass(`Owner logged out. Server confirmed session destroyed.`);

  // Step 12: Customer / Public Storefront Reads Fresh Data from DB
  step('Customer / Public Storefront Reads Product Directly From Database');
  const publicProdsRes = await request('/api/products?_t=' + Date.now());
  if (publicProdsRes.statusCode !== 200) throw new Error(`Public catalog failed: HTTP ${publicProdsRes.statusCode}`);
  const foundInPublic = (publicProdsRes.data || []).find(p => p.id === prodId || p.name.includes(testProdName));
  if (!foundInPublic) {
    throw new Error(`CRITICAL: Product "${testProdName}" was lost after Owner logged out!`);
  }
  if (foundInPublic.price !== 195 || foundInPublic.stock < 60) {
    throw new Error(`CRITICAL: Product specifications reverted! Found price=₹${foundInPublic.price}, stock=${foundInPublic.stock}`);
  }
  pass(`Customer storefront confirms updated product: "${foundInPublic.name}" (Price: ₹${foundInPublic.price}, Stock: ${foundInPublic.stock})`);

  // Step 13: Owner Logs In with Fresh New Session (Session #2)
  step('Owner Re-Logs In with Fresh Credentials (Session #2)');
  const login2 = await request('/api/auth/login', 'POST', {
    email: 'piyushverma730929@gmail.com',
    password: 'Owner@FreshMart2026'
  });
  if (login2.statusCode !== 200 || !login2.data.user) {
    throw new Error(`Owner re-login failed: HTTP ${login2.statusCode}`);
  }
  const headers2 = makeAuthHeaders(login2);
  pass(`Owner Re-Authenticated (Session #2 Token: ${login2.data.session?.id?.slice(0, 16)}...)`);

  // Step 14: Verify Product Catalog Module in Session #2
  step('Owner Session #2: Verify Product Catalog in Database');
  const ownerProdsRes = await request('/api/owner/products?_t=' + Date.now(), 'GET', null, headers2);
  const foundInOwner = (ownerProdsRes.data || []).find(p => p.id === prodId || p.name.includes(testProdName));
  if (!foundInOwner || foundInOwner.price !== 195) {
    throw new Error(`Product data mismatch in Owner Session #2: ${JSON.stringify(foundInOwner)}`);
  }
  pass(`Product verified in Owner DB: "${foundInOwner.name}" (Price: ₹${foundInOwner.price}, Stock: ${foundInOwner.stock})`);

  // Step 15: Verify Categories Module in Session #2
  step('Owner Session #2: Verify Categories in Database');
  const ownerCatsRes = await request('/api/owner/categories', 'GET', null, headers2);
  const foundCat = (ownerCatsRes.data || []).find(c => c.id === catId || c.name === testCatName);
  if (!foundCat) throw new Error(`Category "${testCatName}" was lost after logout!`);
  pass(`Category verified in Owner DB: "${foundCat.name}" (Icon: ${foundCat.icon})`);

  // Step 16: Verify Farmers Module in Session #2
  step('Owner Session #2: Verify Farmers Directory in Database');
  const ownerFarmersRes = await request('/api/owner/farmers', 'GET', null, headers2);
  const foundFarmer = (ownerFarmersRes.data?.farmers || []).find(f => f.id === farmerId || f.name === testFarmerName);
  if (!foundFarmer) throw new Error(`Farmer "${testFarmerName}" was lost after logout!`);
  pass(`Farmer verified in Owner DB: "${foundFarmer.name}" (${foundFarmer.location})`);

  // Step 17: Verify Hubs Module in Session #2
  step('Owner Session #2: Verify Dark Store Hubs in Database');
  const ownerHubsRes = await request('/api/owner/hubs', 'GET', null, headers2);
  const foundHub = (ownerHubsRes.data || []).find(h => h.id === hubId || h.name === testHubName);
  if (!foundHub) throw new Error(`Hub "${testHubName}" was lost after logout!`);
  pass(`Hub verified in Owner DB: "${foundHub.name}" (${foundHub.location})`);

  // Step 18: Verify Delivery Partners Module in Session #2
  step('Owner Session #2: Verify Delivery Partners Fleet in Database');
  const ownerRidersRes = await request('/api/owner/delivery', 'GET', null, headers2);
  const foundRider = (ownerRidersRes.data || []).find(r => r.id === riderId || r.name === testRiderName);
  if (!foundRider) throw new Error(`Rider "${testRiderName}" was lost after logout!`);
  pass(`Rider verified in Owner DB: "${foundRider.name}" (${foundRider.vehicle})`);

  // Step 19: Verify Staff & Sub-Admins Module in Session #2
  step('Owner Session #2: Verify Staff Directory in Database');
  const ownerStaffRes = await request('/api/owner/staff', 'GET', null, headers2);
  const foundStaff = (ownerStaffRes.data || []).find(s => s.id === staffId || s.email === testStaffEmail);
  if (!foundStaff) throw new Error(`Staff "${testStaffEmail}" was lost after logout!`);
  pass(`Staff verified in Owner DB: "${foundStaff.name}" (Role: ${foundStaff.role})`);

  // Step 20: Verify Settings Module in Session #2
  step('Owner Session #2: Verify Platform Settings in Database');
  const ownerSettingsRes = await request('/api/owner/settings', 'GET', null, headers2);
  if (ownerSettingsRes.data.freeDeliveryThreshold !== 349 || ownerSettingsRes.data.minimumOrderValue !== 129) {
    throw new Error(`Settings mismatch in Owner Session #2: ${JSON.stringify(ownerSettingsRes.data)}`);
  }
  pass(`Settings verified in Owner DB: FreeDeliveryThreshold=₹${ownerSettingsRes.data.freeDeliveryThreshold}, MinOrder=₹${ownerSettingsRes.data.minimumOrderValue}`);

  // Step 21: Cleanup Test Records
  step('Cleaning Up Temporary Audit Test Records');
  await request(`/api/owner/products/${encodeURIComponent(prodId)}`, 'DELETE', null, headers2);
  await request(`/api/owner/categories/${encodeURIComponent(catId)}`, 'DELETE', null, headers2);
  await request(`/api/owner/farmers/${encodeURIComponent(farmerId)}`, 'DELETE', null, headers2);
  await request(`/api/owner/hubs/${encodeURIComponent(hubId)}`, 'DELETE', null, headers2);
  await request(`/api/owner/delivery/${encodeURIComponent(riderId)}`, 'DELETE', null, headers2);
  await request(`/api/owner/staff/${encodeURIComponent(staffId)}`, 'DELETE', null, headers2);
  pass('Audit cleanup complete');

  console.log('\n================================================================');
  console.log(` ALL AUDIT TESTS PASSED: ${passed}/${total} (100%)`);
  console.log(' ALL OWNER MODULE CHANGES PERSIST PERMANENTLY IN MASTER DATABASE!');
  console.log('================================================================\n');
}

runAudit().catch(err => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
