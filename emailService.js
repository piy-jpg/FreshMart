/**
 * FreshMart Email Notification Service
 * Handles transactional emails for Email Verification, Password Reset,
 * Welcome Onboarding, and Security Activity Alerts.
 */

const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || 'FreshMart Fresh <no-reply@freshmart.in>';
    this.siteUrl = process.env.SITE_URL || 'http://localhost:8080';
    this.outbox = []; // In-memory development outbox for audit and testing
  }

  /**
   * Base responsive HTML email wrapper with FreshMart fresh branding
   */
  wrapEmailTemplate(title, preheader, bodyContent) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e7e5e4; }
    .header { background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: #ffffff; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
    .badge { display: inline-block; background: rgba(52, 211, 153, 0.2); color: #a7f3d0; border: 1px solid rgba(52, 211, 153, 0.4); font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .btn { display: inline-block; background: #047857; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 14px; margin: 24px 0 16px 0; text-align: center; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25); }
    .btn:hover { background: #065f46; }
    .token-box { background: #f5f5f4; border: 1px dashed #d6d3d1; padding: 16px; border-radius: 14px; font-family: monospace; font-size: 16px; font-weight: bold; letter-spacing: 2px; text-align: center; margin: 20px 0; color: #064e3b; }
    .footer { background: #fafaf9; padding: 24px 32px; text-align: center; border-top: 1px solid #e7e5e4; font-size: 12px; color: #78716c; }
    .footer a { color: #059669; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="header">
      <div class="logo">🌱 FreshMart</div>
      <div class="badge">Farm to Kitchen Express</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;"><strong>FreshMart Fresh Pvt Ltd</strong> • 100ft Road, HAL 2nd Stage, Indiranagar, Bengaluru</p>
      <p style="margin: 0;">24x7 Kisan Support: <a href="tel:180037374627">1800-FRESH-MART</a> • <a href="${this.siteUrl}">Visit Storefront</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Send Email Verification Link
   */
  async sendVerificationEmail(user, token) {
    const userObj = typeof user === 'string' ? { email: user, name: 'Valued Customer' } : user;
    const verifyUrl = `${this.siteUrl}/?verify_email_token=${encodeURIComponent(token)}`;
    const title = 'Verify Your FreshMart Email Address';
    const preheader = 'Please confirm your email to activate your FreshMart farm-to-kitchen account.';

    const bodyContent = `
      <h2 style="margin-top: 0; font-size: 22px; font-weight: 800; color: #0f172a;">Welcome to FreshMart, ${userObj.name || 'Valued Customer'}! 🌱</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
        Thank you for creating an account with FreshMart. To ensure the highest level of security and unlock your 90-minute express farm produce deliveries, please verify your email address.
      </p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify My Email Address →</a>
      </div>
      <p style="font-size: 13px; color: #78716c; margin-top: 10px;">
        Or copy and paste this verification code into the prompt:
      </p>
      <div class="token-box">${token}</div>
      <p style="font-size: 12px; color: #a8a29e; line-height: 1.5;">
        This verification link will expire in 24 hours. If you did not create a FreshMart account, you can safely disregard this email.
      </p>
    `;

    const html = this.wrapEmailTemplate(title, preheader, bodyContent);
    return this.dispatch(userObj.email, title, html, { type: 'VERIFICATION', token, verifyUrl });
  }

  /**
   * Send Password Reset Link
   */
  async sendPasswordResetEmail(user, token) {
    const userObj = typeof user === 'string' ? { email: user, name: 'Valued Customer' } : user;
    const resetUrl = `${this.siteUrl}/?reset_password_token=${encodeURIComponent(token)}`;
    const title = 'Reset Your FreshMart Password';
    const preheader = 'Secure link to reset your FreshMart farm-to-kitchen password.';

    const bodyContent = `
      <h2 style="margin-top: 0; font-size: 22px; font-weight: 800; color: #0f172a;">Password Reset Request 🔐</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
        Hello ${userObj.name || 'there'}, we received a request to reset your password for your FreshMart account (${userObj.email}).
      </p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset My Password →</a>
      </div>
      <p style="font-size: 13px; color: #78716c; margin-top: 10px;">
        Or use this reset security token:
      </p>
      <div class="token-box">${token}</div>
      <p style="font-size: 12px; color: #a8a29e; line-height: 1.5;">
        For your protection, this reset link is valid for only <strong>60 minutes</strong>. If you did not request a password reset, please change your password immediately or contact our support team.
      </p>
    `;

    const html = this.wrapEmailTemplate(title, preheader, bodyContent);
    return this.dispatch(user.email, title, html, { type: 'PASSWORD_RESET', token, resetUrl });
  }

  /**
   * Send Welcome Onboarding Email
   */
  async sendWelcomeEmail(user) {
    const title = 'Welcome to the FreshMart Farm Club! 🥦';
    const preheader = 'Your account is verified. Enjoy flat ₹100 off your first farm-fresh order.';

    const bodyContent = `
      <h2 style="margin-top: 0; font-size: 22px; font-weight: 800; color: #064e3b;">You\'re Officially Verified! 🎉</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
        Hi ${user.name}, welcome to FreshMart! Your account is active and you are now a member of the <strong>Gold Farm Club</strong>.
      </p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px;">🎁 Welcome Gift: Flat ₹100 OFF</h4>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #047857;">Use promo code at checkout on your first order of ₹299 or more:</p>
        <span style="font-family: monospace; font-size: 18px; font-weight: 900; background: #ffffff; border: 1px dashed #059669; padding: 6px 14px; border-radius: 8px; color: #047857; display: inline-block;">FIRST100</span>
      </div>
      <div style="text-align: center;">
        <a href="${this.siteUrl}" class="btn">Start Shopping Farm Fresh →</a>
      </div>
    `;

    const html = this.wrapEmailTemplate(title, preheader, bodyContent);
    return this.dispatch(user.email, title, html, { type: 'WELCOME' });
  }

  /**
   * Send Security / Password Changed Notification
   */
  async sendSecurityAlert(user, actionTitle, actionDetails) {
    const title = `Security Alert: ${actionTitle}`;
    const preheader = `Important security update regarding your FreshMart account.`;

    const bodyContent = `
      <h2 style="margin-top: 0; font-size: 22px; font-weight: 800; color: #991b1b;">Security Notification ⚠️</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
        Hello ${user.name}, this is an automated alert to notify you that your FreshMart account experienced the following activity:
      </p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 16px; margin: 18px 0; font-size: 13px; color: #991b1b;">
        <strong>Activity:</strong> ${actionTitle}<br>
        <strong>Details:</strong> ${actionDetails}<br>
        <strong>Time:</strong> ${new Date().toUTCString()}
      </div>
      <p style="font-size: 13px; color: #78716c;">
        If you performed this action, no further steps are required. If you did not authorize this change, please immediately reset your password and contact customer care at 1800-FRESH-MART.
      </p>
    `;

    const html = this.wrapEmailTemplate(title, preheader, bodyContent);
    return this.dispatch(user.email, title, html, { type: 'SECURITY_ALERT', actionTitle });
  }

  /**
   * Dispatch email handler
   * Writes to development audit outbox and console for testing
   */
  async dispatch(recipient, subject, html, metadata = {}) {
    const record = {
      id: 'eml_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      to: recipient,
      from: this.fromAddress,
      subject,
      metadata
    };

    this.outbox.unshift(record);
    if (this.outbox.length > 100) this.outbox.pop();

    console.log(`\n📧 [EMAIL DISPATCHED] -> To: ${recipient} | Subject: "${subject}"`);
    if (metadata.verifyUrl) {
      console.log(`   🔗 Direct Verification Link: ${metadata.verifyUrl}`);
    }
    if (metadata.resetUrl) {
      console.log(`   🔑 Direct Password Reset Link: ${metadata.resetUrl}`);
    }
    if (metadata.token) {
      console.log(`   🎫 Token: ${metadata.token}\n`);
    }

    return { success: true, messageId: record.id, html, ...metadata };
  }

  /**
   * Get latest dispatched emails for a recipient (used for testing or admin preview)
   */
  getLatestEmails(recipient = null) {
    if (!recipient) return this.outbox;
    return this.outbox.filter(e => e.to.toLowerCase() === recipient.toLowerCase());
  }
}

const emailService = new EmailService();
module.exports = emailService;
