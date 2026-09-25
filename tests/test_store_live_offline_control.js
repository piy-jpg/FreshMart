const http = require('http');
const database = require('../database');
const PostgresAdapter = require('../database/adapters/postgresAdapter');
const postgresAdapter = database.postgres || new PostgresAdapter();

async function runTests() {
  console.log('🧪 Starting Store Live/Offline Control Tests...\n');
  
  const serverModule = require('../server');
  const server = serverModule.server || serverModule;
  const PORT = 3099;

  let testServer;
  await new Promise((resolve) => {
    testServer = server.listen(PORT, () => {
      console.log(`✅ Test server running on http://localhost:${PORT}`);
      resolve();
    });
  });

  const baseUrl = `http://localhost:${PORT}`;

  function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      const req = http.request(url, {
        method,
        headers: reqHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let parsed = data;
          try { parsed = JSON.parse(data); } catch(e) {}
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  try {
    // 1. Check initial product count in PostgreSQL
    let initialProds = [];
    if (postgresAdapter.isAvailable()) {
      initialProds = await postgresAdapter.getAllProducts();
      console.log(`📦 Initial PostgreSQL products count: ${initialProds.length}`);
    }

    // 2. Test GET /api/store/status
    console.log('\n--- Test 1: GET /api/store/status ---');
    const statusRes = await request('GET', '/api/store/status');
    console.log('Status Response:', statusRes.body);
    if (statusRes.status !== 200 || !statusRes.body.success) {
      throw new Error(`Expected 200 OK with success:true, got ${statusRes.status}`);
    }
    console.log('✅ GET /api/store/status passed');

    // 3. Login as Owner to get auth cookie/session
    console.log('\n--- Test 2: Owner Authentication ---');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'piyushverma730929@gmail.com',
      password: 'password123'
    });
    console.log('Login Response Status:', loginRes.status, loginRes.body.user ? loginRes.body.user.email : 'Failed');
    if (loginRes.status !== 200 || !loginRes.body.success) {
      throw new Error('Owner login failed');
    }
    const cookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'].join('; ') : '';
    const token = loginRes.body.session?.token || loginRes.body.session?.id;
    const authHeaders = {
      'Cookie': cookie,
      'Authorization': `Bearer ${token}`
    };
    console.log('✅ Owner authenticated successfully');

    // 4. Set Store Status to OFFLINE
    console.log('\n--- Test 3: Set Store Status to OFFLINE ---');
    const offlineRes = await request('POST', '/api/owner/store/status', {
      status: 'OFFLINE',
      message: 'Store is temporarily closed for maintenance.'
    }, authHeaders);
    console.log('Offline Update Response:', offlineRes.body);
    const offlineStatus = offlineRes.body.status || offlineRes.body.data?.status;
    if (offlineRes.status !== 200 || !offlineRes.body.success || offlineStatus !== 'OFFLINE') {
      throw new Error(`Failed to set store status to OFFLINE: ${JSON.stringify(offlineRes.body)}`);
    }

    // Verify in PostgreSQL
    if (postgresAdapter.isAvailable()) {
      const pgSetting = await postgresAdapter.getSetting('store_status');
      console.log('PostgreSQL Setting store_status:', pgSetting);
      if (!pgSetting || pgSetting.status !== 'OFFLINE' || pgSetting.isOpen !== false) {
        throw new Error('PostgreSQL freshmart_settings does not reflect OFFLINE status');
      }
      console.log('✅ PostgreSQL freshmart_settings verified for OFFLINE');

      const auditLogs = await postgresAdapter.getAuditLogs(10);
      const offlineLog = auditLogs.find(l => l.action === 'UPDATE_STORE_STATUS' && l.details?.newStatus === 'OFFLINE');
      if (!offlineLog) {
        throw new Error('freshmart_audit_logs did not record OFFLINE status update');
      }
      console.log('✅ freshmart_audit_logs verified for OFFLINE toggle:', offlineLog.action, offlineLog.operator_email);
    }

    // 5. Test Order Placement while OFFLINE (Must be rejected with 403)
    console.log('\n--- Test 4: Attempt Order Placement while Store is OFFLINE ---');
    const orderPayload = {
      items: [
        { id: 'tomato', name: 'Fresh Tomato', price: 10, qty: 1, weightLabel: '1 kg' }
      ],
      deliverySlot: 'Express Delivery (30–90 Mins)',
      paymentMethod: 'Cash on Delivery',
      deliveryAddress: {
        tag: 'Home',
        fullName: 'Test Customer',
        phone: '9876543210',
        flat: '101',
        street: 'Main Road',
        city: 'Bengaluru',
        pincode: '560001'
      }
    };

    const blockedOrderRes = await request('POST', '/api/orders', orderPayload, authHeaders);
    console.log('Blocked Order Response Status:', blockedOrderRes.status, blockedOrderRes.body);
    if (blockedOrderRes.status !== 403 && blockedOrderRes.status !== 503) {
      throw new Error(`Expected 403 or 503 HTTP status for offline order, got ${blockedOrderRes.status}`);
    }
    if (blockedOrderRes.body.code !== 'STORE_OFFLINE') {
      throw new Error(`Expected code STORE_OFFLINE, got ${blockedOrderRes.body.code}`);
    }
    console.log('✅ Order placement blocked strictly server-side with HTTP 403 STORE_OFFLINE');

    // 6. Set Store Status back to LIVE
    console.log('\n--- Test 5: Set Store Status back to LIVE ---');
    const liveRes = await request('POST', '/api/owner/store/status', {
      status: 'LIVE',
      message: 'Store is open for orders.'
    }, authHeaders);
    console.log('Live Update Response:', liveRes.body);
    const liveStatus = liveRes.body.status || liveRes.body.data?.status;
    if (liveRes.status !== 200 || !liveRes.body.success || liveStatus !== 'LIVE') {
      throw new Error(`Failed to set store status to LIVE: ${JSON.stringify(liveRes.body)}`);
    }

    // Verify in PostgreSQL
    if (postgresAdapter.isAvailable()) {
      const pgSetting = await postgresAdapter.getSetting('store_status');
      console.log('PostgreSQL Setting store_status after LIVE toggle:', pgSetting);
      if (!pgSetting || pgSetting.status !== 'LIVE' || pgSetting.isOpen !== true) {
        throw new Error('PostgreSQL freshmart_settings does not reflect LIVE status');
      }
      console.log('✅ PostgreSQL freshmart_settings verified for LIVE');

      const auditLogs = await postgresAdapter.getAuditLogs(10);
      const liveLog = auditLogs.find(l => l.action === 'UPDATE_STORE_STATUS' && l.details?.newStatus === 'LIVE');
      if (!liveLog) {
        throw new Error('freshmart_audit_logs did not record LIVE status update');
      }
      console.log('✅ freshmart_audit_logs verified for LIVE toggle:', liveLog.action, liveLog.operator_email);
    }

    // 7. Test Order Placement while LIVE (Must succeed)
    console.log('\n--- Test 6: Attempt Order Placement while Store is LIVE ---');
    const allowedOrderRes = await request('POST', '/api/orders', orderPayload, authHeaders);
    console.log('Allowed Order Response Status:', allowedOrderRes.status, allowedOrderRes.body.orderId || allowedOrderRes.body.id);
    if (allowedOrderRes.status !== 200 && allowedOrderRes.status !== 201) {
      throw new Error(`Expected 200/201 HTTP status for live order, got ${allowedOrderRes.status}: ${JSON.stringify(allowedOrderRes.body)}`);
    }
    console.log('✅ Order placement succeeded when LIVE');

    // 8. Verify Products and Data Integrity
    console.log('\n--- Test 7: Verify Products Data Integrity ---');
    if (postgresAdapter.isAvailable()) {
      const finalProds = await postgresAdapter.getAllProducts();
      console.log(`📦 Final PostgreSQL products count: ${finalProds.length}`);
      if (finalProds.length !== initialProds.length) {
        throw new Error(`Product count changed! Initial: ${initialProds.length}, Final: ${finalProds.length}`);
      }
      console.log('✅ Zero product data loss confirmed in PostgreSQL');
    }

    console.log('\n🎉 ALL STORE LIVE/OFFLINE CONTROL TESTS PASSED PERFECTLY!\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exitCode = 1;
  } finally {
    testServer.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
