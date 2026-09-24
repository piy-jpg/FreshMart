const { db } = require('../../database/connection');
const { userRepository } = require('../repositories');
const { hashPassword, verifyPassword, generateRandomToken } = require('../../shared/utilities');

class AuthService {
  async registerUser(userData) {
    const { name, email, phone, password } = userData;
    const existing = userRepository.findByEmail(email);

    if (existing) {
      if (existing.emailVerified) {
        throw new Error('An account with this email already exists. Please sign in.');
      }
      // Resend token
      const token = generateRandomToken(24);
      userRepository.update(existing.id, {
        name,
        phone,
        ...hashPassword(password),
        verificationToken: token,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      return { user: existing, token, isNew: false };
    }

    const { hash, salt } = hashPassword(password);
    const token = generateRandomToken(24);
    const isAutoVerified = process.env.REQUIRE_EMAIL_VERIFICATION !== 'true';
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name,
      email,
      phone,
      passwordHash: hash,
      salt,
      emailVerified: isAutoVerified,
      verificationToken: isAutoVerified ? null : token,
      verificationTokenExpires: isAutoVerified ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      provider: 'local',
      role: 'CUSTOMER',
      membership: 'Gold Farm Club',
      walletBalance: 100,
      totalOrdersCount: 0,
      totalSpent: 0,
      failedLoginAttempts: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    userRepository.create(newUser);
    return { user: newUser, token, isNew: true };
  }

  async authenticate(identifier, password) {
    const user = userRepository.findByIdentifier(identifier);
    if (!user) throw new Error('Invalid credentials. User account not found.');

    const statusLower = String(user.status || '').toLowerCase();
    if (user.active === false || statusLower === 'inactive' || statusLower === 'blocked' || statusLower === 'deactivated') {
      throw new Error('This account has been deactivated or temporarily locked. Please contact the administrator.');
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt || user.passwordSalt);
    if (!isValid) throw new Error('Invalid email or password.');

    return user;
  }
}

module.exports = new AuthService();
