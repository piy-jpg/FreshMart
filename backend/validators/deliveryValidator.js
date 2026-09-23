function validateOTPVerification(otp) {
  if (!otp || String(otp).trim().length !== 4) {
    return { valid: false, error: 'A valid 4-digit OTP is required.' };
  }
  return { valid: true, otp: String(otp).trim() };
}

module.exports = {
  validateOTPVerification
};
