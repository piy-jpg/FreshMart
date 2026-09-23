const AuthService = require('../services/authService');
module.exports = {
  login: async (req, res) => {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      res.json({ success: true, user: result.user });
    } catch (e) {
      res.status(401).json({ error: e.message });
    }
  }
};
