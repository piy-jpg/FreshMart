/**
 * FreshMart Delivery Boy Login & Dashboard Integration Test Suite (In-Process)
 * Verifies end-to-end Delivery Boy provisioning, login, role redirection, route guards, and dashboard integration.
 */

const assert = require('assert');
const { PassThrough, EventEmitter } = require('stream');
const db = require('./database');
const server = require('./server');

function createMockReqRes(options = {}, body = null) {
  const req = new PassThrough();
  req.method = options.method || 'GET';
  req.url = options.url || '/';
  req.headers = Object.fromEntries(
    Object.entries(options.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  req.connection = { remoteAddress: '127.0.0.1' };
  req.socket = { remoteAddress: '127.0.0.1' };

  let statusCode = 200;
  const headers = {};
  let bodyChunks = [];
  let responseData = null;

  const res = new EventEmitter();
  res.setHeader = (name, val) => {
    const key = name.toLowerCase();
    if (key === 'set-cookie') {
      if (!headers['set-cookie']) headers['set-cookie'] = [];
      if (Array.isArray(val)) headers['set-cookie'].push(...val);
      else headers['set-cookie'].push(val);
    } else {
      headers[key] = val;
    }
  };
  res.getHeader = (name) => headers[name.toLowerCase()];
  res.writeHead = (code, h) => {
    statusCode = code;
    if (h) {
      for (const [k, v] of Object.entries(h)) res.setHeader(k, v);
    }
    return res;
  };
  res.write = (chunk) => {
    if (chunk) bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  };
  res.end = (chunk) => {
    if (chunk) bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const fullBody = Buffer.concat(bodyChunks).toString('utf8');
    try {
      responseData = JSON.parse(fullBody);
    } catch (e) {
      responseData = fullBody;
    }
    res.emit('finish');
  };

  if (body) {
    const payload = typeof body === 'object' ? JSON.stringify(body) : String(body);
    req.write(payload);
  }
  req.end();

  return {
    req,
    res,
    getBody: () => responseData,
    getStatusCode: () => statusCode,
    getHeaders: () => headers
  };
}

async function dispatchRequest(options = {}, body = null) {
  const { req, res, getBody, getStatusCode, getHeaders } = createMockReqRes(options, body);
  const handler = server.server.listeners('request')[0];

  return new Promise((resolve) => {
    res.on('finish', () => {
      resolve({
        statusCode: getStatusCode(),
        headers: getHeaders(),
        body: getBody()
      });
    });
    handler(req, res);
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const match = cookieStr.match(/sjh_session=([^;]+)/);
  return match ? `sjh_session=${match[1]}` : null;
}

async function runDeliveryIntegrationTestSuite() {
  console.log('🚚 Starting Delivery Boy Login & Dashboard Integration Test Suite...\n');

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
      if (err.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
      failed++;
    }
  }

  const OWNER_EMAIL = 'piyushverma730929@gmail.com';
  let ownerSessionCookie = null;
  let kannuUser = null;
  let kannuSessionCookie = null;

  // ----------------------------------------------------
  // 1. Owner Login
  // ----------------------------------------------------
  await test('1. Store Owner authenticates with full privileges', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: OWNER_EMAIL,
      password: 'FreshMart@2026'
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.user.role, 'OWNER');
    assert.strictEqual(res.body.redirectUrl, '/owner');
    ownerSessionCookie = extractCookie(res.headers);
    assert.ok(ownerSessionCookie);
  });

  // ----------------------------------------------------
  // 2. Owner provisions Kannu as Delivery Boy (Section 1 & 11)
  // ----------------------------------------------------
  await test('2. Owner creates Delivery Boy account for Kannu', async () => {
    // Clean up previous test run artifacts if present
    db.data.users = (db.data.users || []).filter(u => (u.email || '').toLowerCase() !== 'kannu.rider@freshmart.com');
    db.save();

    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/owner/staff',
      headers: { 'content-type': 'application/json', 'cookie': ownerSessionCookie }
    }, {
      name: 'Kannu',
      email: 'kannu.rider@freshmart.com',
      phone: '9988776655',
      employeeId: 'EMP-004',
      role: 'Delivery Boy',
      password: 'FreshMart@2026',
      status: 'Active'
    });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.staff.name, 'Kannu');
    assert.strictEqual(res.body.staff.role, 'Delivery Boy');
    assert.strictEqual(res.body.staff.phone, '9988776655');
    assert.strictEqual(res.body.staff.employeeId, 'EMP-004');
    assert.strictEqual(res.body.staff.passwordHash, undefined, 'Password hash must never be leaked to client');
    kannuUser = res.body.staff;
  });

  // ----------------------------------------------------
  // 3. Multi-Identifier Delivery Boy Logins & Redirects (Section 2 & 3)
  // ----------------------------------------------------
  await test('3A. Delivery Boy logs in via Phone Number (9988776655) -> Redirects to /delivery', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: '9988776655',
      password: 'FreshMart@2026'
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.role, 'Delivery Boy');
    assert.strictEqual(res.body.redirectUrl, '/delivery');
    kannuSessionCookie = extractCookie(res.headers);
    assert.ok(kannuSessionCookie);
  });

  await test('3B. Delivery Boy logs in via Employee ID (EMP-004) -> Redirects to /delivery', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: 'EMP-004',
      password: 'FreshMart@2026'
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.redirectUrl, '/delivery');
  });

  await test('3C. Delivery Boy logs in via Email -> Redirects to /delivery', async () => {
    const res = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: kannuUser.email,
      password: 'FreshMart@2026'
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.redirectUrl, '/delivery');
  });

  // ----------------------------------------------------
  // 4. Server-Side Security & Route Protection (Section 7)
  // ----------------------------------------------------
  await test('4A. Security: Delivery Boy accessing /owner is redirected (302) to /delivery', async () => {
    const res = await dispatchRequest({
      method: 'GET',
      url: '/owner',
      headers: { 'cookie': kannuSessionCookie }
    });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/delivery');
  });

  await test('4B. Security: Delivery Boy accessing /admin/staff is redirected to /delivery', async () => {
    const res = await dispatchRequest({
      method: 'GET',
      url: '/admin/staff',
      headers: { 'cookie': kannuSessionCookie }
    });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/delivery');
  });

  await test('4C. Security: Delivery Boy accessing /settings or /audit is redirected to /delivery', async () => {
    const resSettings = await dispatchRequest({
      method: 'GET',
      url: '/settings',
      headers: { 'cookie': kannuSessionCookie }
    });
    assert.strictEqual(resSettings.statusCode, 302);
    assert.strictEqual(resSettings.headers.location, '/delivery');

    const resAudit = await dispatchRequest({
      method: 'GET',
      url: '/audit',
      headers: { 'cookie': kannuSessionCookie }
    });
    assert.strictEqual(resAudit.statusCode, 302);
    assert.strictEqual(resAudit.headers.location, '/delivery');
  });

  await test('4D. Security: Delivery Boy blocked (403) from Owner API operations', async () => {
    const resStaff = await dispatchRequest({
      method: 'GET',
      url: '/api/owner/staff',
      headers: { 'cookie': kannuSessionCookie }
    });
    assert.strictEqual(resStaff.statusCode, 403);

    const resSettings = await dispatchRequest({
      method: 'POST',
      url: '/api/owner/settings',
      headers: { 'content-type': 'application/json', 'cookie': kannuSessionCookie }
    }, { deliveryFee: 50 });
    assert.strictEqual(resSettings.statusCode, 403);
  });

  await test('4E. Route Guard: Unauthenticated user accessing /delivery is redirected to signin', async () => {
    const res = await dispatchRequest({
      method: 'GET',
      url: '/delivery'
    });

    assert.strictEqual(res.statusCode, 302);
    assert.strictEqual(res.headers.location, '/?auth=signin&returnTo=/delivery');
  });

  // ----------------------------------------------------
  // 5. Account Deactivation Enforcement (Section 12)
  // ----------------------------------------------------
  await test('5. Deactivation: Deactivated Delivery Boy cannot log in or access /delivery', async () => {
    // Owner sets Kannu to Inactive
    const deactRes = await dispatchRequest({
      method: 'PATCH',
      url: `/api/owner/staff/${kannuUser.id}`,
      headers: { 'content-type': 'application/json', 'cookie': ownerSessionCookie }
    }, {
      name: 'Kannu',
      phone: '9988776655',
      role: 'Delivery Boy',
      status: 'Inactive'
    });
    assert.strictEqual(deactRes.statusCode, 200);

    // Login attempt fails with 403
    const loginAttempt = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: '9988776655',
      password: 'FreshMart@2026'
    });
    assert.strictEqual(loginAttempt.statusCode, 403);
    assert(loginAttempt.body.error.includes('deactivated') || loginAttempt.body.error.includes('locked'));

    // Old invalidated session accessing /delivery is redirected to signin
    const pageAccess = await dispatchRequest({
      method: 'GET',
      url: '/delivery',
      headers: { 'cookie': kannuSessionCookie }
    });
    assert.strictEqual(pageAccess.statusCode, 302);
    assert(pageAccess.headers.location.includes('/?auth=signin'));

    // Re-activate Kannu for subsequent tests
    const reactRes = await dispatchRequest({
      method: 'PATCH',
      url: `/api/owner/staff/${kannuUser.id}`,
      headers: { 'content-type': 'application/json', 'cookie': ownerSessionCookie }
    }, {
      name: 'Kannu',
      phone: '9988776655',
      role: 'Delivery Boy',
      status: 'Active'
    });
    assert.strictEqual(reactRes.statusCode, 200);
  });

  // ----------------------------------------------------
  // 6. Delivery Boy Dashboard API & Orders Handling (Section 4 & 6)
  // ----------------------------------------------------
  await test('6. Delivery Dashboard: Orders query and session verification', async () => {
    // Relogin Kannu after reactivation
    const relogin = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: '9988776655',
      password: 'FreshMart@2026'
    });
    assert.strictEqual(relogin.statusCode, 200, `Relogin failed: ${JSON.stringify(relogin.body)}`);
    const activeCookie = extractCookie(relogin.headers);
    assert.ok(activeCookie);

    // /api/auth/me returns active Delivery Boy user profile
    const meRes = await dispatchRequest({
      method: 'GET',
      url: '/api/auth/me',
      headers: { 'cookie': activeCookie }
    });
    assert.strictEqual(meRes.statusCode, 200);
    assert.strictEqual(meRes.body.isAuthenticated, true);
    assert.strictEqual(meRes.body.user.name, 'Kannu');
    assert.strictEqual(meRes.body.user.role, 'Delivery Boy');
    assert.strictEqual(meRes.body.user.employeeId, 'EMP-004');
    assert.strictEqual(meRes.body.user.phone, '9988776655');

    // Orders query returns list
    const ordersRes = await dispatchRequest({
      method: 'GET',
      url: '/api/orders',
      headers: { 'cookie': activeCookie }
    });
    assert.strictEqual(ordersRes.statusCode, 200);
    assert(Array.isArray(ordersRes.body));
  });

  // ----------------------------------------------------
  // 7. Live Pappu (Delivery Boy) Login Verification
  // ----------------------------------------------------
  await test('7. Pappu Delivery Boy logs in via Email (pappu@gmail.com) & Phone (7300212948) -> /delivery', async () => {
    // 7A. Login with Email
    const resEmail = await dispatchRequest({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'content-type': 'application/json' }
    }, {
      identifier: 'pappu@gmail.com',
      password: 'Freshmart'
    });
    assert.strictEqual(resEmail.statusCode, 200);
    assert.strictEqual(resEmail.body.redirectUrl, '/delivery');
    assert.strictEqual(resEmail.body.user.name.toLowerCase(), 'pappu');
    assert.ok(['DELIVERY_BOY', 'Delivery Boy'].includes(resEmail.body.user.role));

    const pappuCookie = extractCookie(resEmail.headers);
    assert.ok(pappuCookie);

    // 7B. Access /delivery page with session
    const deliveryPage = await dispatchRequest({
      method: 'GET',
      url: '/delivery',
      headers: { 'cookie': pappuCookie }
    });
    assert.strictEqual(deliveryPage.statusCode, 200);

    // 7C. Security: Access /owner is redirected to /delivery
    const ownerRedirect = await dispatchRequest({
      method: 'GET',
      url: '/owner',
      headers: { 'cookie': pappuCookie }
    });
    assert.strictEqual(ownerRedirect.statusCode, 302);
    assert.strictEqual(ownerRedirect.headers['location'], '/delivery');
  });

  console.log('\n------------------------------------------------------');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed.`);
  console.log('------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL DELIVERY BOY LOGIN & DASHBOARD TESTS PASSED 100%! 🚚\n');
  }
}

runDeliveryIntegrationTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
