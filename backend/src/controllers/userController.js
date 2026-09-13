module.exports = {
  getProfile: (req, res) => res.json({ success: true, user: req.user })
};
