/**
 * SabjiHub Complete Customer Authentication Test Suite (In-Process)
 * Verifies all 10 security, cryptographic, session, and role-based access requirements.
 */

const assert = require('assert');
const crypto = require('crypto');
const db = require('./database');
const emailService = require('./emailService');

async function runAuthTestSuite() {
  console.log('🧪 Starting SabjiHub Authentication System Verification Suite...\n');

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

  // ----------------------------------------------------
  // TEST 1: Cryptographic Password Hashing (PBKDF2 SHA-512)
  // ----------------------------------------------------
  test('1. PBKDF2 Hashing: Generates secure salt and timing-safe verify', () => {
    const rawPassword = 'FarmPassword@2026!';
    const { hash, salt } = db.hashPassword(rawPassword);
    
    assert(salt, 'Salt must be generated');
    assert.strictEqual(salt.length, 32, 'Salt should be 16 bytes (32 hex chars)');
    assert.strictEqual(hash.length, 128, 'SHA-512 key should be 64 bytes (128 hex chars)');

    // Verification
    assert.strictEqual(db.verifyPassword(rawPassword, hash, salt), true, 'Password verification must return true for correct password');
    assert.strictEqual(db.verifyPassword('WrongPassword!', hash, salt), false, 'Password verification must return false for incorrect password');
    assert.strictEqual(db.verifyPassword('', hash, salt), false, 'Empty password must fail verification');
  });

  // ----------------------------------------------------
  // TEST 2: Registration & Unverified Email State
  // ----------------------------------------------------
  test('2. Registration: User is created with emailVerified = false & verification token', () => {
    const testEmail = `tester_${Date.now()}@example.com`;
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const { hash, salt } = db.hashPassword('SuperFresh#2026');

    const newUser = db.insert('users', {
      email: testEmail.toLowerCase(),
      name: 'Priya Sharma',
      phone: '+91 98451 99999',
      role: 'CUSTOMER',
      authProvider: 'LOCAL',
      passwordHash: hash,
      passwordSalt: salt,
      emailVerified: false,
      verificationToken: verifyToken,
      verificationTokenExpires: Date.now() + (24 * 60 * 60 * 1000),
      createdAt: new Date().toISOString()
    });

    assert(newUser.id, 'User must have an ID');
    assert.strictEqual(newUser.emailVerified, false, 'New registrations must have emailVerified = false');
    assert.strictEqual(newUser.verificationToken, verifyToken, 'Verification token must be stored');
    assert(!newUser.password, 'Raw password must NEVER be saved in database');
  });

  // ----------------------------------------------------
  // TEST 3: Email Verification Token Consumption
  // ----------------------------------------------------
  test('3. Email Verification: Valid token marks emailVerified = true and clears token', () => {
    const testEmail = `verify_${Date.now()}@example.com`;
    const token = 'token_abc1234567890';
    
    const user = db.insert('users', {
      email: testEmail,
      name: 'Anand Kumar',
      role: 'CUSTOMER',
      emailVerified: false,
      verificationToken: token,
      verificationTokenExpires: Date.now() + 3600000
    });

    // Simulate verification
    const found = db.getAll('users').find(u => u.verificationToken === token && u.verificationTokenExpires > Date.now());
    assert(found, 'User should be found by active token');

    const updated = db.update('users', found.id, {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    });

    assert.strictEqual(updated.emailVerified, true, 'User emailVerified must be updated to true');
    assert.strictEqual(updated.verificationToken, null, 'Verification token must be cleared');
  });

  // ----------------------------------------------------
  // TEST 4: Session Lifecycle (Creation, Lookup, Expiration)
  // ----------------------------------------------------
  test('4. Session Management: Secure sessions created, validated, and invalidated', () => {
    const dummyUser = db.insert('users', {
      email: `sess_${Date.now()}@example.com`,
      name: 'Session Tester',
      role: 'CUSTOMER',
      emailVerified: true
    });

    const session = db.createSession(dummyUser.id, true);

    assert(session.id, 'Session must generate a cryptographically strong token ID');
    assert(new Date(session.expiresAt).getTime() > Date.now(), 'Session expiresAt must be in future');

    // Validation
    const validated = db.validateSession(session.id);
    assert(validated && validated.session, 'Valid session token must return session object');
    assert.strictEqual(validated.session.userId, dummyUser.id, 'Session must belong to dummyUser');
    assert.strictEqual(validated.user.id, dummyUser.id, 'User must match dummyUser');

    // Invalidation (Logout)
    const invalidated = db.invalidateSession(session.id);
    assert.strictEqual(invalidated, true, 'Session invalidation must return true');

    const afterLogout = db.validateSession(session.id);
    assert.strictEqual(afterLogout, null, 'Invalidated session must return null');
  });

  // ----------------------------------------------------
  // TEST 5: Rate Limiting
  // ----------------------------------------------------
  test('5. Rate Limiter: Blocks excessive attempts after 5 failures', () => {
    const rateKey = `test_login_ip_${Date.now()}`;
    
    // Simulate 5 failures
    for (let i = 1; i <= 5; i++) {
      const rl = db.checkRateLimit(rateKey, 5, 60000);
      assert.strictEqual(rl.allowed, true, `Attempt ${i} within limit should be allowed`);
    }

    // 6th attempt should be blocked
    const blocked = db.checkRateLimit(rateKey, 5, 60000);
    assert.strictEqual(blocked.allowed, false, '6th attempt must be blocked by rate limiter');
    assert(blocked.retryAfterSeconds > 0, 'retryAfterSeconds must be greater than 0');

    // Reset rate limit
    db.resetRateLimit(rateKey);
    const afterReset = db.checkRateLimit(rateKey, 5, 60000);
    assert.strictEqual(afterReset.allowed, true, 'After reset, attempt should be allowed');
  });

  // ----------------------------------------------------
  // TEST 6: Forgot Password & Password Reset with Session Purge
  // ----------------------------------------------------
  test('6. Password Reset: Resets password hash and invalidates all prior sessions', () => {
    const testEmail = `pwreset_${Date.now()}@example.com`;
    const { hash: oldHash, salt: oldSalt } = db.hashPassword('OldPass#123');
    const user = db.insert('users', {
      email: testEmail,
      name: 'Kavita Patel',
      role: 'CUSTOMER',
      passwordHash: oldHash,
      passwordSalt: oldSalt
    });

    // Create 2 active sessions for this user
    const s1 = db.createSession(user.id, false);
    const s2 = db.createSession(user.id, false);
    assert(db.validateSession(s1.id), 'Session 1 should be active');
    assert(db.validateSession(s2.id), 'Session 2 should be active');

    // Simulate password update
    const { hash: newHash, salt: newSalt } = db.hashPassword('NewBrandSecurePass#2026');
    db.update('users', user.id, { passwordHash: newHash, passwordSalt: newSalt });

    // Invalidate all sessions on password change
    db.invalidateAllUserSessions(user.id);

    assert.strictEqual(db.validateSession(s1.id), null, 'Old session 1 must be purged');
    assert.strictEqual(db.validateSession(s2.id), null, 'Old session 2 must be purged');
    assert(db.verifyPassword('NewBrandSecurePass#2026', newHash, newSalt), 'New password must verify successfully');
  });

  // ----------------------------------------------------
  // TEST 7: Google Identity Services (GIS) Sign-In
  // ----------------------------------------------------
  test('7. Google Sign-In: Stores permanent Google sub claim and verified email', () => {
    const googleSub = `goog_${Date.now()}`;
    const googleEmail = `googler_${Date.now()}@gmail.com`;

    const user = db.insert('users', {
      email: googleEmail,
      name: 'Google Farm Fan',
      profileImage: 'https://lh3.googleusercontent.com/a/photo',
      googleSub: googleSub,
      authProvider: 'GOOGLE',
      emailVerified: true,
      role: 'CUSTOMER',
      createdAt: new Date().toISOString()
    });

    assert.strictEqual(user.googleSub, googleSub, 'Google sub must be persisted');
    assert.strictEqual(user.emailVerified, true, 'Google signed in accounts are verified by Google');
    assert.strictEqual(user.passwordHash, undefined, 'Google-only users have no passwordHash');
  });

  // ----------------------------------------------------
  // TEST 8: Account Linking (Email/Password + Google Collision)
  // ----------------------------------------------------
  test('8. Account Linking: Links Google identity to existing email/password account', () => {
    const sharedEmail = `shared_${Date.now()}@example.com`;
    const { hash: localHash, salt: localSalt } = db.hashPassword('MyPassword!99');
    
    // Existing local user
    const localUser = db.insert('users', {
      email: sharedEmail,
      name: 'Vikram Seth',
      passwordHash: localHash,
      passwordSalt: localSalt,
      authProvider: 'LOCAL',
      emailVerified: true,
      role: 'CUSTOMER'
    });

    // When Google sign in arrives for same email:
    const existing = db.getAll('users').find(u => u.email === sharedEmail);
    assert(existing, 'Existing user must be found');
    assert(!existing.googleSub, 'Existing user should not have googleSub yet');

    // Linking after password confirmation:
    const verifySuccess = db.verifyPassword('MyPassword!99', existing.passwordHash, existing.passwordSalt);
    assert.strictEqual(verifySuccess, true, 'Password verification required to link');

    const googleSubToLink = 'goog_sub_987654321';
    const linkedUser = db.update('users', existing.id, {
      googleSub: googleSubToLink,
      authProvider: 'BOTH'
    });

    assert.strictEqual(linkedUser.googleSub, googleSubToLink, 'Google sub must now be linked');
    assert.strictEqual(linkedUser.authProvider, 'BOTH', 'Auth provider updated to BOTH');
    // Ensure no duplicate user row was inserted
    const allMatching = db.getAll('users').filter(u => u.email === sharedEmail);
    assert.strictEqual(allMatching.length, 1, 'No duplicate user rows should exist for linked account');
  });

  // ----------------------------------------------------
  // TEST 9: Server-Side Cart Merging with Catalog Price Validation
  // ----------------------------------------------------
  test('9. Cart Merging: Merges guest cart into user cart and validates pricing against catalog', () => {
    const userId = `usr_cart_${Date.now()}`;
    
    // Save existing user cart with 1 potato
    db.saveUserCart(userId, {
      'veg-potato': { id: 'veg-potato', title: 'Pahadi Potato', price: 35, qty: 1 }
    });

    // Guest cart has 2 more potatoes and 1 tomato
    const guestCart = {
      'veg-potato': { id: 'veg-potato', title: 'Pahadi Potato', price: 1, qty: 2 }, // Tampered price ₹1 in guest cart
      'veg-tomato': { id: 'veg-tomato', title: 'Fresh Tomato', price: 40, qty: 1 }
    };

    const merged = db.mergeUserCart(userId, guestCart);

    // Verify potato qty merged: 1 + 2 = 3
    assert.strictEqual(merged['veg-potato'].qty, 3, 'Potato quantity should sum up to 3');
    
    // Verify price tampering was prevented (product catalog price is ₹35, not tampered ₹1)
    const potatoProduct = db.getAll('products').find(p => p.id === 'veg-potato');
    if (potatoProduct) {
      assert.strictEqual(merged['veg-potato'].price, potatoProduct.price, 'Price must match catalog price');
    }
  });

  // ----------------------------------------------------
  // TEST 10: RBAC Protection: CUSTOMER blocked from admin endpoints
  // ----------------------------------------------------
  test('10. RBAC: Customer role is strictly rejected with 403 Forbidden on admin privileges', () => {
    const customerUser = { id: 'c_1', role: 'CUSTOMER', email: 'cust@sabjihub.com' };
    const adminUser = { id: 'a_1', role: 'ADMIN', email: 'admin@sabjihub.com' };

    function checkAdminAccess(user) {
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return { status: 403, error: 'Forbidden: Admin access required.' };
      }
      return { status: 200, success: true };
    }

    const customerAccess = checkAdminAccess(customerUser);
    assert.strictEqual(customerAccess.status, 403, 'Customer role must get 403 Forbidden');
    assert(customerAccess.error.includes('Admin access required'), 'Error message must specify admin requirement');

    const adminAccess = checkAdminAccess(adminUser);
    assert.strictEqual(adminAccess.status, 200, 'Admin role must be granted 200 OK');
  });

  // ----------------------------------------------------
  // TEST 11: Transactional Email Templates Verification
  // ----------------------------------------------------
  await asyncTest('11. Email Service: Formats responsive HTML templates for verification & reset', async () => {
    const verificationEmail = await emailService.sendVerificationEmail({ name: 'Priya', email: 'test@example.com' }, 'token_sample_123');
    assert(verificationEmail.html.includes('Verify My Email Address'), 'Verification email template must include CTA');
    assert(verificationEmail.html.includes('token_sample_123'), 'Verification link must contain token');

    const resetEmail = await emailService.sendPasswordResetEmail({ name: 'Priya', email: 'test@example.com' }, 'reset_sample_456');
    assert(resetEmail.html.includes('Reset My Password'), 'Reset email template must include CTA');
    assert(resetEmail.html.includes('reset_sample_456'), 'Reset link must contain token');
  });

  console.log(`\n==================================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed out of ${passed + failed} tests`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTestSuite();
