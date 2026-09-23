function validateRegister(body) {
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  const password = body.password || '';
  const confirmPassword = body.confirmPassword || '';
  const termsAccepted = Boolean(body.termsAccepted);

  if (!name) return { valid: false, error: 'Full name is required.' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  if (!termsAccepted) {
    return { valid: false, error: 'You must agree to the Terms & Conditions and Privacy Policy.' };
  }

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
    };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Password confirmation does not match.' };
  }

  return { valid: true, data: { name, email, phone, password } };
}

function validateLogin(body) {
  const identifier = (body.identifier || body.email || body.phone || body.employeeId || '').trim();
  const password = body.password || '';
  if (!identifier || !password) {
    return { valid: false, error: 'Email / Employee ID / Phone and password are required.' };
  }
  return { valid: true, data: { identifier, password, rememberMe: Boolean(body.rememberMe) } };
}

module.exports = {
  validateRegister,
  validateLogin
};
