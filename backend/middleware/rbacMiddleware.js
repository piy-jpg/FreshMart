const { sendJson } = require('../../shared/utilities');
const { normalizeRole } = require('../../shared/enums');
const { extractUserSession } = require('./authMiddleware');
const { db } = require('../../database/connection');

const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'piyushverma730929@gmail.com').toLowerCase().trim();

function isOwnerEmail(email) {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === OWNER_EMAIL || clean === 'owner@freshmart.local' || clean === 'owner@freshmart.in' || clean === 'owner@sabjihub.local';
}

function isAuthorizedAdminOrOwner(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role) || isOwnerEmail(user.email);
}

function requireOwner(req, res, next) {
  const auth = extractUserSession(req);
  if (!auth || !auth.user) {
    return sendJson(res, 401, { error: 'Authentication required. Please sign in as store owner or administrator.' });
  }

  const freshUser = db.getById('users', auth.user.id) || auth.user;
  const isAuthorized = isAuthorizedAdminOrOwner(freshUser);

  if (!isAuthorized) {
    return sendJson(res, 403, { error: 'Forbidden: Owner or Admin privileges required.' });
  }

  req.auth = auth;
  req.user = freshUser;
  if (typeof next === 'function') next();
  return freshUser;
}

function requireStaffOrOwner(req, res, next) {
  const auth = extractUserSession(req);
  if (!auth || !auth.user) {
    return sendJson(res, 401, { error: 'Authentication required.' });
  }

  const freshUser = db.getById('users', auth.user.id) || auth.user;
  const role = normalizeRole(freshUser.role);
  const allowed = isAuthorizedAdminOrOwner(freshUser) || role === 'SUB_ADMIN' || role === 'INVENTORY_MANAGER' || role === 'HUB_MANAGER';

  if (!allowed) {
    return sendJson(res, 403, { error: 'Forbidden: Staff, Admin, or Owner privileges required.' });
  }

  req.auth = auth;
  req.user = freshUser;
  if (typeof next === 'function') next();
  return freshUser;
}

function requireDeliveryBoy(req, res, next) {
  const auth = extractUserSession(req);
  if (!auth || !auth.user) {
    return sendJson(res, 401, { error: 'Authentication required. Please sign in as Delivery Boy.' });
  }

  const freshUser = db.getById('users', auth.user.id) || auth.user;
  const role = normalizeRole(freshUser.role);
  const allowed = role === 'DELIVERY_BOY' || isAuthorizedAdminOrOwner(freshUser);

  if (!allowed) {
    return sendJson(res, 403, { error: 'Forbidden: Delivery Boy access required.' });
  }

  req.auth = auth;
  req.user = freshUser;
  if (typeof next === 'function') next();
  return freshUser;
}

module.exports = {
  OWNER_EMAIL,
  isOwnerEmail,
  requireOwner,
  requireStaffOrOwner,
  requireDeliveryBoy
};
