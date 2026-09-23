const { db } = require('../config/database');
const { hashPassword, verifyPassword } = require('../utils/hashPassword');
const { generateToken } = require('../utils/generateToken');

class AuthService {
  static async login(email, password) {
    const user = db.getAll('users').find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      throw new Error('Invalid email or password');
    }
    const session = db.createSession(user.id, true);
    return { user, session };
  }
}
module.exports = AuthService;
