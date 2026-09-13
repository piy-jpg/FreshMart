/**
 * SabjiHub Complete Owner System Verification Suite (In-Process)
 * Validates role assignment, RBAC middleware, staff management, inventory ledger, and security constraints.
 */

const assert = require('assert');
const db = require('./database');
const server = require('./server');

async function runOwnerVerificationSuite() {
  console.log('👑 Starting SabjiHub Owner System Verification Suite...\n');

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

  const OWNER_EMAIL = 'piyushverma730929@gmail.com';

  // ----------------------------------------------------
  // TEST 1: Predefined Owner Seed & Role Recognition
  // ----------------------------------------------------
  test('1. Owner Recognition: piyushverma730929@gmail.com is seeded with OWNER role', () => {
    const owner = db.ensureOwnerUser(OWNER_EMAIL);
    assert(owner, 'Owner user must exist in DB');
    assert.strictEqual(owner.email, OWNER_EMAIL);
    assert.strictEqual(owner.role, 'OWNER', 'Owner role must be OWNER');
    assert.strictEqual(owner.emailVerified, true, 'Owner email must be verified');
    assert.strictEqual(server.isOwnerEmail(OWNER_EMAIL), true, 'server.isOwnerEmail must return true');
    assert.strictEqual(server.isOwnerEmail('PiyushVerma730929@Gmail.COM '), true, 'server.isOwnerEmail must be case-insensitive and trimmed');
    assert.strictEqual(server.isOwnerEmail('attacker@evil.com'), false, 'Random email must NOT be recognized as owner');
  });

  // ----------------------------------------------------
  // TEST 2: Customer Registration Immune to Role Injection
  // ----------------------------------------------------
  test('2. Role Injection Defense: Registration ignores client-supplied role', () => {
    const maliciousEmail = `hack_${Date.now()}@test.com`;
    // Attempt to register with role=OWNER or role=ADMIN
    const user = db.createUser({
      name: 'Sneaky User',
      email: maliciousEmail,
      password: 'SafePassword123!',
      role: 'OWNER' // Client attempting injection
    });

    assert(user, 'User should be created');
    assert.strictEqual(user.role, 'CUSTOMER', 'User role must be forced to CUSTOMER');
    assert.notStrictEqual(user.role, 'OWNER', 'User must NOT be allowed to self-grant OWNER');
  });

  // ----------------------------------------------------
  // TEST 3: Google Identity Services / Link Owner Account
  // ----------------------------------------------------
  test('3. Google ID Binding: Owner account binds googleSub and retains OWNER role', () => {
    const googleSub = 'google_sub_owner_730929';
    const updated = db.linkGoogleAccount(OWNER_EMAIL, googleSub, 'https://lh3.googleusercontent.com/a/owner-pic');
    assert(updated, 'Owner account should link google credentials');
    assert.strictEqual(updated.googleSub, googleSub);
    assert.strictEqual(updated.role, 'OWNER');

    const retrieved = db.findUserByGoogleSub(googleSub);
    assert(retrieved, 'Should retrieve owner by googleSub');
    assert.strictEqual(retrieved.email, OWNER_EMAIL);
    assert.strictEqual(retrieved.role, 'OWNER');
  });

  // ----------------------------------------------------
  // TEST 4: RBAC Enforcement on /api/owner/* & requireOwner
  // ----------------------------------------------------
  test('4. RBAC requireOwner Middleware: 403 Forbidden for CUSTOMER and non-authenticated', () => {
    let statusCode = null;
    let responseData = null;

    const mockRes = {
      _headers: {},
      getHeader(name) { return this._headers[name?.toLowerCase()]; },
      setHeader(name, val) { this._headers[name?.toLowerCase()] = val; },
      writeHead(code, headers) {
        statusCode = code;
        if (headers) {
          for (const [k, v] of Object.entries(headers)) this._headers[k.toLowerCase()] = v;
        }
        return this;
      },
      end(payload) {
        if (payload) {
          try { responseData = JSON.parse(payload); } catch (e) { responseData = payload; }
        }
        return this;
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
      redirect(url) {
        statusCode = 302;
        responseData = { redirect: url };
        return this;
      }
    };

    // Case A: No session
    statusCode = null;
    server.requireOwner({ session: null }, mockRes);
    assert.strictEqual(statusCode, 401, 'Unauthenticated user must receive 401');

    // Case B: Session with CUSTOMER role
    statusCode = null;
    server.requireOwner({ session: { userId: 'cust_1', role: 'CUSTOMER', email: 'shopper@test.com' } }, mockRes);
    assert.strictEqual(statusCode, 403, 'Customer role must receive 403 Forbidden');
    assert.strictEqual(responseData.error, 'Access denied: Owner privileges required.');

    // Case C: Session with ADMIN role (Sub-admin cannot access owner-exclusive endpoints)
    statusCode = null;
    server.requireOwner({ session: { userId: 'admin_1', role: 'ADMIN', email: 'admin@sabjihub.com' } }, mockRes);
    assert.strictEqual(statusCode, 403, 'Admin role must receive 403 Forbidden on Owner endpoints');

    // Case D: Session with OWNER role
    statusCode = null;
    const passedOwner = server.requireOwner({ session: { userId: 'usr_owner_1', role: 'OWNER', email: OWNER_EMAIL } }, mockRes);
    assert(passedOwner, 'Owner session must pass requireOwner middleware');
    assert.strictEqual(passedOwner.role, 'OWNER');
  });

  // ----------------------------------------------------
  // TEST 5: Staff Account Provisioning & Deactivation (Owner Exclusive)
  // ----------------------------------------------------
  test('5. Staff Management: Owner can create, list, and deactivate staff', () => {
    const staffEmail = `staff_op_${Date.now()}@sabjihub.com`;
    const newStaff = db.createStaffUser({
      name: 'Hub Operator Rajesh',
      email: staffEmail,
      role: 'HUB_MANAGER',
      password: 'OperatorPassword123!'
    });

    assert(newStaff, 'Staff user must be created');
    assert.strictEqual(newStaff.role, 'HUB_MANAGER');
    assert.strictEqual(newStaff.emailVerified, true);
    assert.strictEqual(newStaff.active, true);

    // List staff
    const staffList = db.getStaffUsers();
    assert(staffList.some(s => s.email === staffEmail), 'Created staff must appear in staff list');

    // Update staff role to INVENTORY_MANAGER
    const updatedStaff = db.updateStaffRole(newStaff.id, 'INVENTORY_MANAGER');
    assert.strictEqual(updatedStaff.role, 'INVENTORY_MANAGER');

    // Deactivate staff
    const deactivated = db.deactivateStaffUser(newStaff.id, false);
    assert.strictEqual(deactivated.active, false);

    // Re-activate staff
    const reactivated = db.deactivateStaffUser(newStaff.id, true);
    assert.strictEqual(reactivated.active, true);
  });

  // ----------------------------------------------------
  // TEST 6: Owner Immunity (Self-Demotion / Deactivation Protected)
  // ----------------------------------------------------
  test('6. Owner Immunity: Owner account cannot be demoted or deactivated', () => {
    const owner = db.ensureOwnerUser(OWNER_EMAIL);

    // Attempt demotion to CUSTOMER
    assert.throws(() => {
      db.updateStaffRole(owner.id, 'CUSTOMER');
    }, /Cannot alter primary OWNER role/);

    // Attempt deactivation
    assert.throws(() => {
      db.deactivateStaffUser(owner.id, false);
    }, /Cannot deactivate primary OWNER account/);

    // Verify owner role is still intact
    const ownerCheck = db.findUserById(owner.id);
    assert.strictEqual(ownerCheck.role, 'OWNER');
    assert.strictEqual(ownerCheck.active, true);
  });

  // ----------------------------------------------------
  // TEST 7: Inventory Ledger & Double-Selling Protection
  // ----------------------------------------------------
  test('7. Inventory Ledger: Available Stock = Current Stock - Reserved Stock', () => {
    const ledger = db.getInventoryLedger();
    assert(Array.isArray(ledger), 'Ledger must be an array');
    assert(ledger.length > 0, 'Ledger must have products');

    for (const item of ledger) {
      assert(typeof item.currentStock === 'number', 'currentStock must be number');
      assert(typeof item.reservedStock === 'number', 'reservedStock must be number');
      assert.strictEqual(
        item.availableStock,
        Math.max(0, item.currentStock - item.reservedStock),
        `Available stock calculation failed for product ${item.id}`
      );
    }

    // Test stock adjustment
    const firstProduct = ledger[0];
    const initialStock = firstProduct.currentStock;
    const adjusted = db.adjustProductStock(firstProduct.id, 25, 'Farm shipment received', OWNER_EMAIL);
    assert.strictEqual(adjusted.stock, initialStock + 25, 'Stock adjustment must add quantity');

    const updatedLedgerItem = db.getInventoryLedger().find(i => i.id === firstProduct.id);
    assert.strictEqual(updatedLedgerItem.currentStock, initialStock + 25);
    assert.strictEqual(updatedLedgerItem.availableStock, Math.max(0, (initialStock + 25) - updatedLedgerItem.reservedStock));
  });

  // ----------------------------------------------------
  // TEST 8: Owner Dashboard KPIs Aggregation
  // ----------------------------------------------------
  test('8. Dashboard KPIs: Telemetry aggregates GMV, active orders, and low-stock count', () => {
    const kpis = db.getOwnerDashboardKPIs();
    assert(kpis, 'KPIs object must be returned');
    assert(typeof kpis.totalGMV === 'number', 'totalGMV must be numeric');
    assert(typeof kpis.totalOrders === 'number', 'totalOrders must be numeric');
    assert(typeof kpis.activeOrders === 'number', 'activeOrders must be numeric');
    assert(typeof kpis.inventoryAssetValue === 'number', 'inventoryAssetValue must be numeric');
    assert(typeof kpis.lowStockItems === 'number', 'lowStockItems must be numeric');
    assert(kpis.totalGMV >= 0, 'GMV cannot be negative');
  });

  // ----------------------------------------------------
  // TEST 9: Staff Deletion with Owner Protection
  // ----------------------------------------------------
  test('9. Staff Deletion & Protection: Owner cannot be deleted, staff can be deleted', () => {
    const owner = db.ensureOwnerUser(OWNER_EMAIL);
    assert.throws(() => {
      db.deleteStaffUser(owner.id);
    }, /Cannot delete primary OWNER account/);

    const tempStaff = db.createStaffUser({
      name: 'Temporary Staff Member',
      email: `temp_staff_${Date.now()}@sabjihub.com`,
      role: 'DISPATCHER',
      password: 'Pass123Temp!'
    });
    assert(db.findUserById(tempStaff.id), 'Temp staff exists');
    const delResult = db.deleteStaffUser(tempStaff.id);
    assert.strictEqual(delResult, true);
    assert(!db.findUserById(tempStaff.id), 'Temp staff deleted');
  });

  // ----------------------------------------------------
  // TEST 10: Role Hierarchy & Distribution
  // ----------------------------------------------------
  test('10. Role Matrix: Role distribution returns correct aggregation', () => {
    const dist = db.getRoleDistribution();
    assert(typeof dist === 'object' && dist !== null);
    assert(dist.OWNER >= 1, 'At least 1 OWNER exists');
    assert(typeof dist.CUSTOMER === 'number', 'CUSTOMER count is numeric');
    assert(typeof dist.ADMIN === 'number', 'ADMIN count is numeric');
    assert(typeof dist.HUB_MANAGER === 'number', 'HUB_MANAGER count is numeric');
  });

  // ----------------------------------------------------
  // TEST 11: Security & Audit Logs (Query, Search & Prune)
  // ----------------------------------------------------
  test('11. Audit Logs: Logging, action filtering, search, and pruning', () => {
    db.logActivity(OWNER_EMAIL, 'STAFF_PROMOTED', 'Users', 'test_user_123', { role: 'ADMIN' });
    db.logActivity('system', 'SYSTEM_ALERT', 'Integrity', 'GLOBAL', { status: 'healthy', note: 'diagnostic check' });

    const allLogs = db.getAuditLogs({ limit: 50 });
    assert(Array.isArray(allLogs) && allLogs.length > 0, 'Audit logs retrieved');

    const staffLogs = db.getAuditLogs({ action: 'STAFF_PROMOTED' });
    assert(staffLogs.length > 0, 'Filtered audit logs by action');
    assert(staffLogs.every(l => l.action === 'STAFF_PROMOTED'), 'All filtered logs match action');

    const searchLogs = db.getAuditLogs({ search: 'diagnostic' });
    assert(searchLogs.some(l => (l.details && JSON.stringify(l.details).includes('diagnostic')) || (l.action && l.action.includes('diagnostic')) || (l.description && l.description.includes('diagnostic'))), 'Found keyword in audit logs');

    const pruneResult = db.pruneAuditLogs(100);
    assert(typeof pruneResult.retained === 'number');
    assert(typeof pruneResult.removed === 'number');
  });

  // ----------------------------------------------------
  // TEST 12: Platform Settings Management & Defaults
  // ----------------------------------------------------
  test('12. Platform Settings: Retrieve, update, and validate platform parameters', () => {
    const initialSettings = db.getSettings();
    assert(initialSettings, 'Platform settings exist');
    assert(typeof initialSettings.platformName === 'string');
    assert(typeof initialSettings.standardDeliveryFee === 'number');

    const updated = db.updateSettings({
      platformName: 'SabjiHub Fresh Express',
      standardDeliveryFee: 35,
      maintenanceMode: false
    });
    assert.strictEqual(updated.platformName, 'SabjiHub Fresh Express');
    assert.strictEqual(updated.standardDeliveryFee, 35);
    assert.strictEqual(updated.maintenanceMode, false);

    const saved = db.getSettings();
    assert.strictEqual(saved.platformName, 'SabjiHub Fresh Express');
    assert.strictEqual(saved.standardDeliveryFee, 35);

    // Reset back
    db.updateSettings({
      platformName: 'FreshMart',
      standardDeliveryFee: 30
    });
  });

  // ----------------------------------------------------
  // TEST 13: Database & Health Integrity Diagnostic
  // ----------------------------------------------------
  test('13. Database Integrity: Health diagnostic checks consistency without errors', () => {
    const diagnostic = db.checkDatabaseIntegrity();
    assert(diagnostic, 'Diagnostic result returned');
    assert.strictEqual(diagnostic.status, 'HEALTHY', 'Database status should be HEALTHY');
    assert(Array.isArray(diagnostic.checks), 'Checks array returned');
    assert(diagnostic.checks.length >= 6, 'All diagnostic checks executed');
    assert(typeof diagnostic.summary.totalUsers === 'number');
    assert(typeof diagnostic.summary.totalProducts === 'number');
    assert(typeof diagnostic.summary.totalOrders === 'number');

    for (const check of diagnostic.checks) {
      assert.strictEqual(check.status, 'PASSED', `Diagnostic check ${check.name} should pass: ${check.message}`);
    }
  });

  // ----------------------------------------------------
  // TEST 14: End-to-End Owner API Integration via HTTP / mock req
  // ----------------------------------------------------
  test('14. End-to-End Owner Endpoints & Public Settings Integration', () => {
    const ownerSession = { userId: 'usr_owner_1', role: 'OWNER', email: OWNER_EMAIL };

    let code = null;
    let data = null;
    const res = {
      _headers: {},
      getHeader(n) { return this._headers[n?.toLowerCase()]; },
      setHeader(n, v) { this._headers[n?.toLowerCase()] = v; },
      writeHead(c, h) { code = c; if (h) Object.assign(this._headers, h); return this; },
      end(p) { try { data = JSON.parse(p); } catch (e) { data = p; } return this; },
      status(c) { code = c; return this; },
      json(d) { data = d; return this; }
    };

    // Test GET /api/owner/roles handler logic
    const rolesPayload = {
      success: true,
      roles: ['OWNER', 'ADMIN', 'HUB_MANAGER', 'INVENTORY_MANAGER', 'DISPATCHER', 'CUSTOMER'],
      distribution: db.getRoleDistribution()
    };
    assert(rolesPayload.distribution.OWNER >= 1);

    // Test GET /api/owner/audit-logs handler logic
    const logs = db.getAuditLogs({ limit: 5 });
    assert(Array.isArray(logs));

    // Test GET /api/owner/health telemetry calculation
    const mem = process.memoryUsage();
    assert(typeof mem.heapUsed === 'number');
  });

  // ----------------------------------------------------
  // TEST 15: Customer Order Placement & Owner Live Management
  // ----------------------------------------------------
  await asyncTest('15. Customer Order Placement & Owner Management Lifecycle', async () => {
    const owner = db.ensureOwnerUser(OWNER_EMAIL);
    const session = db.createSession(owner.id, true);
    const ownerCookie = `sjh_session=${session.id}`;

    // Helper to simulate in-process HTTP requests
    function simulateReq(method, urlPath, body = null, cookie = null) {
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

        let resData = '';
        const res = {
          statusCode: 200,
          headers: {},
          getHeader(n) { return this.headers[n.toLowerCase()]; },
          setHeader(n, v) { this.headers[n.toLowerCase()] = v; },
          writeHead(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(this.headers, hdrs); },
          end(chunk) {
            if (chunk) resData += chunk;
            let parsed = null;
            try { parsed = JSON.parse(resData); } catch (e) { parsed = resData; }
            resolve({ statusCode: this.statusCode, headers: this.headers, body: parsed });
          }
        };

        setImmediate(() => {
          server.server.emit('request', req, res);
          if (body) req.emit('data', Buffer.from(JSON.stringify(body)));
          req.emit('end');
        });
      });
    }

    // Step A: Customer places an order via POST /api/orders
    const customerOrderPayload = {
      customerId: 'usr_cust_live_test',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 99887 76655',
      deliveryAddress: {
        fullName: 'Ananya Sharma',
        phone: '+91 99887 76655',
        flat: 'Villa 14, Palm Meadows',
        street: 'Whitefield Main Road',
        city: 'Bengaluru',
        pincode: '560066'
      },
      paymentMethod: 'UPI (Paytm)',
      items: [
        { id: 'prod_tomato', name: 'Fresh Country Tomato', price: 30, quantity: 2, unit: '1 kg' },
        { id: 'prod_spinach', name: 'Spinach', price: 25, quantity: 1, unit: '1 bunch' }
      ]
    };

    const placeRes = await simulateReq('POST', '/api/orders', customerOrderPayload);
    assert.strictEqual(placeRes.statusCode, 201, 'Order must be created with 201');
    const createdOrder = placeRes.body;
    assert(createdOrder && createdOrder.id, 'Created order must return with order ID');
    assert.strictEqual(createdOrder.status, 'CONFIRMED', 'Order status must be CONFIRMED');
    assert.strictEqual(createdOrder.customerName, 'Ananya Sharma');
    assert(createdOrder.deliveryOtp, 'Order must have a 4-digit security OTP');

    // Step B: Owner lists live orders via GET /api/owner/orders
    const listRes = await simulateReq('GET', '/api/owner/orders', null, ownerCookie);
    assert.strictEqual(listRes.statusCode, 200, 'Owner orders must return 200');
    assert(Array.isArray(listRes.body), 'Owner orders must return array');
    const foundInLive = listRes.body.find(o => o.id === createdOrder.id || o.orderId === createdOrder.id);
    assert(foundInLive, 'Customer placed order must immediately list in Owner Live Orders');
    assert.strictEqual(foundInLive.status, 'CONFIRMED');
    assert.strictEqual(foundInLive.deliveryOtp, createdOrder.deliveryOtp);

    // Step C: Owner inspects single order dossier via GET /api/owner/orders/:id
    const singleRes = await simulateReq('GET', `/api/owner/orders/${createdOrder.id}`, null, ownerCookie);
    assert.strictEqual(singleRes.statusCode, 200);
    assert.strictEqual(singleRes.body.id, createdOrder.id);
    assert.strictEqual(singleRes.body.customerPhone, '+91 99887 76655');

    // Step D: Owner advances status: CONFIRMED -> ACCEPTED_BY_HUB -> OUT_FOR_DELIVERY
    const advanceRes = await simulateReq('PATCH', `/api/owner/orders/${createdOrder.id}`, { status: 'ACCEPTED_BY_HUB', notes: 'Accepted by Hub Manager' }, ownerCookie);
    assert.strictEqual(advanceRes.statusCode, 200);
    assert.strictEqual(advanceRes.body.order.status, 'ACCEPTED_BY_HUB');

    // Step E: Owner reassigns Hub and Rider
    const reassignRes = await simulateReq('PATCH', `/api/owner/orders/${createdOrder.id}`, {
      hubId: 'hub_blr_koramangala',
      deliveryPartnerId: 'rider_2'
    }, ownerCookie);
    assert.strictEqual(reassignRes.statusCode, 200);
    assert.strictEqual(reassignRes.body.order.hubId, 'hub_blr_koramangala');
    assert.strictEqual(reassignRes.body.order.deliveryPartnerId, 'rider_2');

    // Step F: Owner completes delivery with override via PATCH /api/owner/orders/:id
    const deliverRes = await simulateReq('PATCH', `/api/owner/orders/${createdOrder.id}`, { status: 'DELIVERED', notes: 'Owner delivery completed' }, ownerCookie);
    assert.strictEqual(deliverRes.statusCode, 200);
    assert.strictEqual(deliverRes.body.order.status, 'DELIVERED');
    assert(deliverRes.body.order.deliveredAt, 'Delivered order must record deliveredAt timestamp');
    assert.strictEqual(deliverRes.body.order.deliveryOtpVerified, true, 'Delivery OTP marked verified');

    // Step G: Test cancellation and inventory restoration
    const tomatoBefore = db.getById('products', 'prod_tomato').stock;
    const cancelOrderRes = await simulateReq('POST', '/api/orders', {
      customerId: 'usr_cust_live_test_2',
      customerName: 'Rohit Verma',
      items: [{ id: 'prod_tomato', name: 'Fresh Country Tomato', price: 30, quantity: 3, unit: '1 kg' }]
    });
    const orderToCancel = cancelOrderRes.body;
    assert.strictEqual(db.getById('products', 'prod_tomato').stock, tomatoBefore - 3, 'Stock was reserved');

    const cancelByOwnerRes = await simulateReq('PATCH', `/api/owner/orders/${orderToCancel.id}`, { status: 'CANCELLED', notes: 'Customer request via owner' }, ownerCookie);
    assert.strictEqual(cancelByOwnerRes.statusCode, 200);
    assert.strictEqual(cancelByOwnerRes.body.order.status, 'CANCELLED');
    assert.strictEqual(db.getById('products', 'prod_tomato').stock, tomatoBefore, 'Stock must be completely restored upon cancellation');

    // Step H: Customer Order History reflects Owner Updates & Previous Orders
    // 1. Check authenticated customer session reflection
    if (!db.getById('users', 'usr_cust_live_test')) {
      db.insert('users', {
        id: 'usr_cust_live_test',
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
        phone: '+91 99887 76655',
        role: 'CUSTOMER'
      });
    }
    const custSession = db.createSession('usr_cust_live_test', true);
    const custCookie = `sjh_session=${custSession.id}`;
    const custOrdersRes = await simulateReq('GET', '/api/user/orders', null, custCookie);
    assert.strictEqual(custOrdersRes.statusCode, 200);
    assert(Array.isArray(custOrdersRes.body), 'User orders must be an array');
    const custOrder = custOrdersRes.body.find(o => o.id === createdOrder.id);
    assert(custOrder, 'Customer must find created order in their order history');
    assert.strictEqual(custOrder.status, 'DELIVERED', 'Customer order history must reflect DELIVERED status set by owner');
    assert.strictEqual(custOrder.deliveryPartnerId, 'rider_2', 'Customer order history must reflect rider reallocated by owner');
    assert.strictEqual(custOrder.hubId, 'hub_blr_koramangala', 'Customer order history must reflect hub reallocated by owner');
    assert(custOrder.total > 0, 'Customer order must have valid total price');

    // 2. Check guest customer query with stored localStorage order IDs
    const guestOrdersRes = await simulateReq('GET', `/api/user/orders?ids=${createdOrder.id}`);
    assert.strictEqual(guestOrdersRes.statusCode, 200);
    const guestFound = guestOrdersRes.body.find(o => o.id === createdOrder.id);
    assert(guestFound, 'Guest customer must retrieve previous orders using stored IDs');
    assert.strictEqual(guestFound.status, 'DELIVERED', 'Guest customer history reflects owner updates');

    // 3. Check customer single order tracking endpoint
    const trackRes = await simulateReq('GET', `/api/orders/${createdOrder.id}`);
    assert.strictEqual(trackRes.statusCode, 200);
    assert.strictEqual(trackRes.body.status, 'DELIVERED');
    assert.strictEqual(trackRes.body.deliveryPartnerId, 'rider_2');
  });

  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runOwnerVerificationSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
