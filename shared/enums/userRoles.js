const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  OWNER: 'OWNER',
  SUB_ADMIN: 'SUB_ADMIN',
  STAFF: 'STAFF',
  DELIVERY_BOY: 'DELIVERY_BOY'
};

function normalizeRole(role) {
  if (!role) return 'CUSTOMER';
  const r = String(role).trim().toUpperCase().replace(/[\s-]/g, '_');
  if (r === 'DELIVERY_BOY' || r === 'DELIVERY' || r === 'RIDER' || r === 'DRIVER') return 'DELIVERY_BOY';
  if (r === 'OWNER' || r === 'SUPER_ADMIN' || r === 'ADMIN_OWNER') return 'OWNER';
  if (r === 'SUB_ADMIN' || r === 'MANAGER' || r === 'STAFF') return 'SUB_ADMIN';
  return 'CUSTOMER';
}

module.exports = {
  USER_ROLES,
  normalizeRole
};
