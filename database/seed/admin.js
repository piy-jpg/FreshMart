const crypto = require('crypto');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

module.exports = [
  {
    id: "usr_owner_01",
    name: "FreshMart Owner",
    email: "owner@freshmart.in",
    phone: "9876543210",
    passwordHash: hashPassword("Owner@FreshMart2026"),
    role: "owner",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr_admin_01",
    name: "Operations Admin",
    email: "admin@freshmart.in",
    phone: "9876543211",
    passwordHash: hashPassword("Admin@FreshMart2026"),
    role: "admin",
    createdAt: new Date().toISOString()
  }
];
