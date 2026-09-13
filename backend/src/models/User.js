class User {
  static sanitize(user) {
    if (!user) return null;
    const { passwordHash, salt, verificationToken, resetToken, ...safe } = user;
    return safe;
  }
}
module.exports = User;
