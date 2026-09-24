const { authService } = require('../services');
const { validateRegister, validateLogin } = require('../validators');
const { sendJson, parseBody, setAuthCookie, clearAuthCookie, sanitizeUser } = require('../../shared/utilities');
const { db } = require('../../database/connection');
const emailService = require('../services/emailService');

class AuthController {
  async register(req, res) {
    const body = await parseBody(req);
    const validation = validateRegister(body);
    if (!validation.valid) {
      return sendJson(res, 400, { error: validation.error });
    }

    try {
      const { user, token } = await authService.registerUser(validation.data);
      const isAutoVerified = process.env.REQUIRE_EMAIL_VERIFICATION !== 'true';
      if (isAutoVerified) {
        user.emailVerified = true;
        db.update('users', user.id, { emailVerified: true });
        const session = db.createSession(user.id, true, req);
        setAuthCookie(res, session.id, true);
        return sendJson(res, 201, {
          success: true,
          message: 'Account created and verified successfully!',
          email: user.email,
          token: session.id,
          verificationToken: token,
          user: sanitizeUser(user),
          needsVerification: false
        });
      }
      await emailService.sendVerificationEmail(user, token);
      return sendJson(res, 201, {
        success: true,
        message: 'Account created! Please check your email to verify your address.',
        email: user.email,
        verificationToken: token,
        needsVerification: true
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  async login(req, res) {
    const body = await parseBody(req);
    const validation = validateLogin(body);
    if (!validation.valid) {
      return sendJson(res, 400, { error: validation.error });
    }

    try {
      const user = await authService.authenticate(validation.data.identifier, validation.data.password);
      const session = db.createSession(user.id, validation.data.rememberMe, req);
      setAuthCookie(res, session.id, validation.data.rememberMe);

      return sendJson(res, 200, {
        success: true,
        user: sanitizeUser(user),
        message: 'Login successful'
      });
    } catch (err) {
      return sendJson(res, 401, { error: err.message });
    }
  }

  async logout(req, res) {
    clearAuthCookie(res);
    return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
  }

  async me(req, res) {
    if (!req.auth || !req.auth.user) {
      return sendJson(res, 200, { isAuthenticated: false, user: null });
    }
    return sendJson(res, 200, {
      isAuthenticated: true,
      user: sanitizeUser(req.auth.user),
      emailVerified: Boolean(req.auth.user.emailVerified)
    });
  }
}

module.exports = new AuthController();
