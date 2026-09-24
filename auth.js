/**
 * SabjiHub Complete Secure Customer Authentication & Account Dashboard Controller
 * Connects to HttpOnly cookie sessions, Google Identity Services, and customer APIs.
 */

(function() {
  'use strict';

  // Global Auth State
  window.sabjihubAuth = window.freshmartAuth = {
    isAuthenticated: false,
    user: null,
    loading: true,
    emailVerified: false,
    googlePendingCredential: null,
    pendingVerificationEmail: ''
  };

  // Google OAuth Client Configuration
  const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '880806707459-ci9gcf8sni1h6u0gmd1qtp96mg2u9l9g.apps.googleusercontent.com';

  // Initialize on DOM Ready
  function bootstrapAuth() {
    ensureAuthModalsInDOM();
    initAuth();
    checkUrlAuthParams();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapAuth);
  } else {
    bootstrapAuth();
  }

  /**
   * 1. Check Session State on Page Load
   */
  async function initAuth() {
    try {
      const token = sessionStorage.getItem('fm_session_token') || localStorage.getItem('fm_session_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
        headers['x-session-token'] = token;
      }
      const res = await fetch('/api/auth/me', { credentials: 'include', headers });
      if (res.ok) {
        const data = await res.json();
        if (data.session && (data.session.token || data.session.id)) {
          const sessionTok = data.session.token || data.session.id;
          sessionStorage.setItem('fm_session_token', sessionTok);
          localStorage.setItem('fm_session_token', sessionTok);
        }
        if (data.isAuthenticated && data.user) {
          window.sabjihubAuth.isAuthenticated = true;
          window.sabjihubAuth.user = data.user;
          window.sabjihubAuth.emailVerified = Boolean(data.emailVerified);
          if (typeof window.loadUserCart === 'function') {
            await window.loadUserCart(data.user.id);
          }
        } else {
          window.sabjihubAuth.isAuthenticated = false;
          window.sabjihubAuth.user = null;
          if (typeof window.loadUserCart === 'function') {
            await window.loadUserCart(null);
          }
        }
      }
    } catch (e) {
      console.warn('Auth session check error', e);
      window.sabjihubAuth.isAuthenticated = false;
      window.sabjihubAuth.user = null;
      if (typeof window.loadUserCart === 'function') {
        await window.loadUserCart(null);
      }
    } finally {
      window.sabjihubAuth.loading = false;
      updateNavAccountButton();
    }
  }

  /**
   * 2. Update Top Navbar Account Button State
   */
  window.updateNavAccountButton = function() {
    const auth = window.sabjihubAuth;
    const accountButtons = document.querySelectorAll('.nav-account-btn, #nav-account-btn');
    const accountLabels = document.querySelectorAll('.nav-account-label, #nav-account-label');
    const accountAvatars = document.querySelectorAll('.nav-account-avatar, #nav-account-avatar');

    if (auth.isAuthenticated && auth.user) {
      const firstName = (auth.user.name || 'Friend').split(' ')[0];
      const isOwner = auth.user.role === 'OWNER';
      
      accountLabels.forEach(lbl => {
        lbl.textContent = isOwner ? `👑 ${firstName} (Owner)` : `Hi, ${firstName} 👋`;
      });

      accountAvatars.forEach(av => {
        if (auth.user.profileImage) {
          av.innerHTML = `<img src="${auth.user.profileImage}" class="w-full h-full object-cover rounded-xl" alt="${firstName}">`;
        } else {
          av.textContent = isOwner ? '👑' : firstName.charAt(0).toUpperCase();
        }
      });

      accountButtons.forEach(btn => {
        if (isOwner) {
          btn.classList.add('border-amber-500/60', 'bg-amber-50/80', 'ring-2', 'ring-amber-400/30');
          btn.classList.remove('border-emerald-500/40', 'bg-emerald-50/60');
          btn.setAttribute('title', 'FreshMart Executive Owner - Click for Account & Owner Console');
        } else {
          btn.classList.add('border-emerald-500/40', 'bg-emerald-50/60');
          btn.classList.remove('border-amber-500/60', 'bg-amber-50/80', 'ring-2', 'ring-amber-400/30');
        }
      });
    } else {
      accountLabels.forEach(lbl => {
        lbl.textContent = 'Account';
      });

      accountAvatars.forEach(av => {
        av.innerHTML = '👤';
      });

      accountButtons.forEach(btn => {
        btn.classList.remove('border-emerald-500/40', 'bg-emerald-50/60', 'border-amber-500/60', 'bg-amber-50/80', 'ring-2', 'ring-amber-400/30');
      });
    }
  };

  /**
   * 3. Handle Navbar Account Click
   */
  window.handleNavAccountClick = function() {
    if (window.sabjihubAuth.isAuthenticated) {
      openAccountDashboard('profile');
    } else {
      openAuthModal('signin');
    }
  };

  /**
   * 4. Auth Modal Controls (Sign In / Create Account)
   */
  window.openAuthModal = function(tab = 'signin') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchAuthView(tab);
    initGoogleSignInButton();
  };

  window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
      clearAuthErrors();
    }
  };

  window.switchAuthView = function(viewName) {
    clearAuthErrors();
    const views = ['signin', 'register', 'check-email', 'forgot', 'reset', 'link-google'];
    views.forEach(v => {
      const el = document.getElementById(`auth-view-${v}`);
      if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`auth-view-${viewName}`);
    if (target) target.classList.remove('hidden');

    // Update tab bar active state if signin or register
    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabRegister = document.getElementById('auth-tab-register');
    const tabContainer = document.getElementById('auth-tab-bar');

    if (['signin', 'register'].includes(viewName)) {
      if (tabContainer) tabContainer.classList.remove('hidden');
      if (viewName === 'signin') {
        tabSignIn?.classList.add('bg-white', 'text-stone-900', 'shadow-xs');
        tabSignIn?.classList.remove('text-stone-500');
        tabRegister?.classList.remove('bg-white', 'text-stone-900', 'shadow-xs');
        tabRegister?.classList.add('text-stone-500');
      } else {
        tabRegister?.classList.add('bg-white', 'text-stone-900', 'shadow-xs');
        tabRegister?.classList.remove('text-stone-500');
        tabSignIn?.classList.remove('bg-white', 'text-stone-900', 'shadow-xs');
        tabSignIn?.classList.add('text-stone-500');
      }
    } else {
      if (tabContainer) tabContainer.classList.add('hidden');
    }
  };

  function showAuthError(msg, viewName = null) {
    const errorContainers = document.querySelectorAll('.auth-error-banner');
    errorContainers.forEach(c => {
      c.textContent = msg;
      c.classList.remove('hidden');
    });
  }

  function clearAuthErrors() {
    const errorContainers = document.querySelectorAll('.auth-error-banner');
    errorContainers.forEach(c => {
      c.textContent = '';
      c.classList.add('hidden');
    });
  }

  /**
   * 5. Real-Time Password Strength Meter
   */
  window.checkPasswordStrength = function(pwd) {
    const bar = document.getElementById('pwd-strength-bar');
    const label = document.getElementById('pwd-strength-label');
    const hint = document.getElementById('pwd-strength-hint');
    if (!bar || !label) return;

    if (!pwd) {
      bar.style.width = '0%';
      bar.className = 'h-1.5 rounded-full transition-all duration-300 bg-stone-200';
      label.textContent = '';
      if (hint) hint.classList.remove('text-emerald-700', 'text-rose-600');
      return;
    }

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score < 3 || pwd.length < 8) {
      bar.style.width = '33%';
      bar.className = 'h-1.5 rounded-full transition-all duration-300 bg-rose-500';
      label.textContent = 'Weak';
      label.className = 'text-[11px] font-bold text-rose-600';
    } else if (score < 5) {
      bar.style.width = '66%';
      bar.className = 'h-1.5 rounded-full transition-all duration-300 bg-amber-500';
      label.textContent = 'Medium';
      label.className = 'text-[11px] font-bold text-amber-600';
    } else {
      bar.style.width = '100%';
      bar.className = 'h-1.5 rounded-full transition-all duration-300 bg-emerald-600';
      label.textContent = 'Strong';
      label.className = 'text-[11px] font-bold text-emerald-700';
    }
  };

  /**
   * 6. Form Submission Handlers
   */

  // Sign In
  window.submitSignIn = async function(e) {
    e.preventDefault();
    clearAuthErrors();

    const email = document.getElementById('signin-email')?.value?.trim();
    const password = document.getElementById('signin-password')?.value;
    const rememberMe = document.getElementById('signin-remember')?.checked;
    const submitBtn = document.getElementById('signin-submit-btn');

    if (!email || !password) {
      showAuthError('Please enter both email and password.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing in...</span>';
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: email, email, password, rememberMe })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.session && (data.session.token || data.session.id)) {
          const sessionTok = data.session.token || data.session.id;
          sessionStorage.setItem('fm_session_token', sessionTok);
          localStorage.setItem('fm_session_token', sessionTok);
        } else if (data.token) {
          sessionStorage.setItem('fm_session_token', data.token);
          localStorage.setItem('fm_session_token', data.token);
        }
        window.sabjihubAuth.isAuthenticated = true;
        window.sabjihubAuth.user = data.user;
        window.sabjihubAuth.emailVerified = true;
        updateNavAccountButton();
        closeAuthModal();
        showToast(`Welcome back, ${data.user.name.split(' ')[0]}! 🌱`, 'success');

        // Load authenticated user cart
        if (typeof window.loadUserCart === 'function') {
          await window.loadUserCart(data.user.id);
        }

        // Redirect based on user role and server-provided route
        const normRole = (data.user?.role || '').toUpperCase().replace(/[\s-]/g, '_');
        if (normRole === 'DELIVERY_BOY' || data.redirectUrl === '/delivery' || data.redirectUrl === '/delivery.html') {
          setTimeout(() => {
            window.location.href = data.redirectUrl || '/delivery';
          }, 350);
          return;
        }
        if (data.redirectUrl && data.redirectUrl !== '/') {
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 350);
          return;
        }
      } else if (res.status === 403 && data.unverified) {
        window.sabjihubAuth.pendingVerificationEmail = data.email || email;
        const emailPlaceholder = document.getElementById('check-email-address');
        if (emailPlaceholder) emailPlaceholder.textContent = window.sabjihubAuth.pendingVerificationEmail;
        switchAuthView('check-email');
      } else {
        showAuthError(data.error || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Sign in error', err);
      showAuthError('Network connection error. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span>';
      }
    }
  };

  // Create Account
  window.submitRegister = async function(e) {
    e.preventDefault();
    clearAuthErrors();

    const name = document.getElementById('reg-name')?.value?.trim();
    const email = document.getElementById('reg-email')?.value?.trim();
    const phone = document.getElementById('reg-phone')?.value?.trim();
    const password = document.getElementById('reg-password')?.value;
    const confirmPassword = document.getElementById('reg-confirm-password')?.value;
    const termsAccepted = document.getElementById('reg-terms')?.checked;
    const submitBtn = document.getElementById('reg-submit-btn');

    if (!termsAccepted) {
      showAuthError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    if (password !== confirmPassword) {
      showAuthError('Passwords do not match. Please recheck.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Creating account...</span>';
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, password, confirmPassword, termsAccepted })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.sabjihubAuth.pendingVerificationEmail = data.email || email;
        const emailPlaceholder = document.getElementById('check-email-address');
        if (emailPlaceholder) emailPlaceholder.textContent = window.sabjihubAuth.pendingVerificationEmail;
        switchAuthView('check-email');
        startResendCooldownTimer();
      } else {
        showAuthError(data.error || 'Failed to create account.');
      }
    } catch (err) {
      console.error('Registration error', err);
      showAuthError('Network error. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span>';
      }
    }
  };

  // Resend Email Verification with Cooldown
  let resendTimerInterval = null;
  window.resendVerificationEmail = async function() {
    const email = window.sabjihubAuth.pendingVerificationEmail || document.getElementById('check-email-address')?.textContent?.trim();
    const resendBtn = document.getElementById('resend-verification-btn');
    if (!email) return;

    try {
      if (resendBtn) resendBtn.disabled = true;
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Verification email resent! Please check your inbox.', 'success');
        startResendCooldownTimer(60);
      } else {
        showToast(data.error || 'Could not resend email. Please wait.', 'error');
        if (resendBtn) resendBtn.disabled = false;
      }
    } catch (e) {
      showToast('Network error while resending email.', 'error');
      if (resendBtn) resendBtn.disabled = false;
    }
  };

  function startResendCooldownTimer(seconds = 60) {
    const resendBtn = document.getElementById('resend-verification-btn');
    if (!resendBtn) return;

    if (resendTimerInterval) clearInterval(resendTimerInterval);
    let remaining = seconds;
    resendBtn.disabled = true;

    resendTimerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(resendTimerInterval);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Email';
      } else {
        resendBtn.textContent = `Resend in ${remaining}s`;
      }
    }, 1000);
  }

  // Forgot Password Form
  window.submitForgotPassword = async function(e) {
    e.preventDefault();
    clearAuthErrors();

    const email = document.getElementById('forgot-email')?.value?.trim();
    const submitBtn = document.getElementById('forgot-submit-btn');

    if (!email) {
      showAuthError('Please enter your email address.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending link...</span>';
      }

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      const msgBox = document.getElementById('forgot-success-msg');
      if (msgBox) {
        msgBox.textContent = data.message;
        msgBox.classList.remove('hidden');
      }
      showToast('Reset request received. Check your email.', 'info');
    } catch (err) {
      showAuthError('Error sending reset link.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Send Reset Link</span>';
      }
    }
  };

  // Reset Password Form
  window.submitResetPassword = async function(e) {
    e.preventDefault();
    clearAuthErrors();

    const token = document.getElementById('reset-token-input')?.value?.trim();
    const newPassword = document.getElementById('reset-password-input')?.value;
    const confirmPassword = document.getElementById('reset-confirm-input')?.value;
    const submitBtn = document.getElementById('reset-submit-btn');

    if (newPassword !== confirmPassword) {
      showAuthError('Passwords do not match.');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Updating...</span>';
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Password reset successfully! Please sign in.', 'success');
        switchAuthView('signin');
      } else {
        showAuthError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      showAuthError('Network error resetting password.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Change Password</span>';
      }
    }
  };

  /**
   * 7. Official Google Identity Services (GIS) Sign-In
   */
  function initGoogleSignInButton() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      setTimeout(initGoogleSignInButton, 300);
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const btnContainer = document.getElementById('google-signin-btn-container');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'left',
          width: 320
        });
      }
    } catch (e) {
      console.warn('GIS button render error', e);
    }
  }

  async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;

    try {
      showToast('Verifying Google credentials...', 'info');
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();

      if (res.ok) {
        window.sabjihubAuth.isAuthenticated = true;
        window.sabjihubAuth.user = data.user;
        window.sabjihubAuth.emailVerified = true;
        updateNavAccountButton();
        closeAuthModal();
        showToast(`Welcome to FreshMart, ${data.user.name.split(' ')[0]}! 🌱`, 'success');
        if (typeof window.loadUserCart === 'function') {
          await window.loadUserCart(data.user.id);
        }

        // Redirect to /owner if user is OWNER or server returned redirectUrl
        if (data.redirectUrl || (data.user && data.user.role === 'OWNER')) {
          setTimeout(() => {
            window.location.href = data.redirectUrl || '/owner';
          }, 350);
          return;
        }
      } else if (res.status === 409 && data.requiresLinking) {
        // Account Linking case!
        window.sabjihubAuth.googlePendingCredential = response.credential;
        document.getElementById('link-google-email').textContent = data.email;
        switchAuthView('link-google');
      } else {
        showAuthError(data.error || 'Google Sign-In failed.');
      }
    } catch (err) {
      console.error('Google Sign-In verification error', err);
      showAuthError('Google Sign-In could not be completed.');
    }
  }

  // Link Google Account Form
  window.submitLinkGoogle = async function(e) {
    e.preventDefault();
    clearAuthErrors();

    const password = document.getElementById('link-google-password')?.value;
    const credential = window.sabjihubAuth.googlePendingCredential;

    if (!credential || !password) {
      showAuthError('Password is required to link this Google account.');
      return;
    }

    try {
      const res = await fetch('/api/auth/link-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.sabjihubAuth.isAuthenticated = true;
        window.sabjihubAuth.user = data.user;
        window.sabjihubAuth.emailVerified = true;
        updateNavAccountButton();
        closeAuthModal();
        showToast('Google account linked successfully! 🌱', 'success');
        if (typeof window.loadUserCart === 'function') {
          await window.loadUserCart(data.user.id);
        }

        // Redirect to /owner if user is OWNER or server returned redirectUrl
        if (data.redirectUrl || (data.user && data.user.role === 'OWNER')) {
          setTimeout(() => {
            window.location.href = data.redirectUrl || '/owner';
          }, 350);
          return;
        }
      } else {
        showAuthError(data.error || 'Incorrect password for linking.');
      }
    } catch (err) {
      showAuthError('Network error while linking accounts.');
    }
  };

  /**
   * 8. Logout
   */
  window.handleCustomerLogout = async function() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}

    window.sabjihubAuth.isAuthenticated = false;
    window.sabjihubAuth.user = null;
    window.sabjihubAuth.emailVerified = false;
    if (typeof window.resetCartState === 'function') {
      window.resetCartState();
    }
    updateNavAccountButton();
    closeAccountDashboard();
    showToast('You have been signed out.', 'info');
  };

  /**
   * 9. Merge Guest Cart with User Account
   */
  async function syncGuestCartWithAccount() {
    try {
      const localCart = JSON.parse(localStorage.getItem('freshmart_cart_guest') || '{}');
      if (!localCart || Object.keys(localCart).length === 0) return;
      const res = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ guestCart: localCart })
      });

      if (res.ok) {
        localStorage.removeItem('freshmart_cart_guest');
        if (typeof window.loadUserCart === 'function') {
          await window.loadUserCart();
        }
      }
    } catch (e) {
      console.warn('Cart merge error', e);
    }
  }

  /**
   * 10. Check URL Search Parameters (Email Verification / Password Reset Links)
   */
  async function checkUrlAuthParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get('verify_email_token');
    const resetToken = urlParams.get('reset_password_token');

    if (verifyToken) {
      // Remove query param cleanly from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast('Verifying your email address...', 'info');

      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: verifyToken })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          window.sabjihubAuth.isAuthenticated = true;
          window.sabjihubAuth.user = data.user;
          window.sabjihubAuth.emailVerified = true;
          updateNavAccountButton();
          showToast('Email verified! Welcome to the Gold Farm Club 🎉', 'success');
        } else {
          showToast(data.error || 'Verification link is invalid or has expired.', 'error');
        }
      } catch (e) {
        showToast('Network error verifying email.', 'error');
      }
    } else if (resetToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      openAuthModal('reset');
      const tokenInput = document.getElementById('reset-token-input');
      if (tokenInput) tokenInput.value = resetToken;
    }
  }

  /**
   * 11. Customer Account Dashboard Controller
   */
  window.openAccountDashboard = function(tab = 'profile') {
    const modal = document.getElementById('account-dashboard-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchDashboardTab(tab);
  };

  window.closeAccountDashboard = function() {
    const modal = document.getElementById('account-dashboard-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  window.switchDashboardTab = function(tabName) {
    document.querySelectorAll('.dash-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.dash-nav-btn').forEach(b => {
      b.classList.remove('bg-emerald-50', 'text-emerald-900', 'font-bold', 'border-emerald-200');
    });

    const activePane = document.getElementById(`dash-pane-${tabName}`);
    const activeBtn = document.getElementById(`dash-nav-${tabName}`);

    if (activePane) activePane.classList.remove('hidden');
    if (activeBtn) activeBtn.classList.add('bg-emerald-50', 'text-emerald-900', 'font-bold', 'border-emerald-200');

    // Load data for selected pane
    if (tabName === 'profile') loadDashboardProfile();
    if (tabName === 'orders') loadDashboardOrders();
    if (tabName === 'addresses') loadDashboardAddresses();
    if (tabName === 'wishlist') loadDashboardWishlist();
    if (tabName === 'security') loadDashboardSecurity();
  };

  function loadDashboardProfile() {
    const user = window.sabjihubAuth.user;
    if (!user) return;

    const nameInput = document.getElementById('dash-profile-name');
    const emailInput = document.getElementById('dash-profile-email');
    const phoneInput = document.getElementById('dash-profile-phone');
    const badgeLabel = document.getElementById('dash-profile-badge');
    const walletLabel = document.getElementById('dash-profile-wallet');
    const avatarImg = document.getElementById('dash-profile-avatar');

    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (badgeLabel) badgeLabel.textContent = user.role === 'OWNER' ? '👑 Executive Owner' : (user.membership || 'Gold Farm Club');
    if (walletLabel) walletLabel.textContent = `₹${user.walletBalance || 0}`;

    const ownerConsoleLink = document.getElementById('dash-owner-console-link');
    if (ownerConsoleLink) {
      const normRole = String(user.role || '').toUpperCase().replace(/[\s-]/g, '_');
      if (normRole === 'OWNER' || user.email === 'piyushverma730929@gmail.com') {
        ownerConsoleLink.classList.remove('hidden');
        ownerConsoleLink.href = '/owner';
        ownerConsoleLink.innerHTML = `
          <span class="flex items-center gap-2">
            <span class="text-base">👑</span>
            <span>Owner Console</span>
          </span>
          <span class="text-[10px] bg-stone-950/20 text-stone-950 px-2 py-0.5 rounded-full font-bold">Launch &rarr;</span>
        `;
        ownerConsoleLink.className = 'mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-between border border-amber-300/40 cursor-pointer';
      } else if (normRole === 'DELIVERY_BOY') {
        ownerConsoleLink.classList.remove('hidden');
        ownerConsoleLink.href = '/delivery';
        ownerConsoleLink.innerHTML = `
          <span class="flex items-center gap-2">
            <span class="text-base">🚚</span>
            <span>Delivery Dashboard</span>
          </span>
          <span class="text-[10px] bg-purple-950/30 text-purple-900 px-2 py-0.5 rounded-full font-bold">Open &rarr;</span>
        `;
        ownerConsoleLink.className = 'mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-between border border-purple-300/40 cursor-pointer';
      } else if (['ADMIN', 'SUB_ADMIN', 'STAFF'].includes(normRole)) {
        ownerConsoleLink.classList.remove('hidden');
        ownerConsoleLink.href = '/owner';
        ownerConsoleLink.innerHTML = `
          <span class="flex items-center gap-2">
            <span class="text-base">🛡️</span>
            <span>Staff Portal</span>
          </span>
          <span class="text-[10px] bg-slate-950/30 text-slate-900 px-2 py-0.5 rounded-full font-bold">Open &rarr;</span>
        `;
        ownerConsoleLink.className = 'mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-between border border-blue-300/40 cursor-pointer';
      } else {
        ownerConsoleLink.classList.add('hidden');
      }
    }
    if (avatarImg) {
      if (user.profileImage) {
        avatarImg.src = user.profileImage;
      } else {
        avatarImg.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
      }
    }
  }

  window.saveDashboardProfile = async function(e) {
    e.preventDefault();
    const name = document.getElementById('dash-profile-name')?.value?.trim();
    const phone = document.getElementById('dash-profile-phone')?.value?.trim();

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, phone })
      });

      if (res.ok) {
        const data = await res.json();
        window.sabjihubAuth.user = data.user;
        updateNavAccountButton();
        showToast('Profile details updated successfully! 🌱', 'success');
      } else {
        showToast('Could not save profile.', 'error');
      }
    } catch (err) {
      showToast('Network error saving profile.', 'error');
    }
  };

  async function loadDashboardOrders() {
    const container = document.getElementById('dash-orders-list');
    if (!container) return;

    container.innerHTML = '<div class="p-8 text-center text-stone-400 font-medium">Loading your farm orders...</div>';

    try {
      // Gather local order history IDs if stored
      let localIds = [];
      try {
        const rawLocal = localStorage.getItem('sabjihub_order_history');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            localIds = parsed.map(x => typeof x === 'object' ? (x.id || x.orderId) : x).filter(Boolean);
          }
        }
        const activeId = localStorage.getItem('sabjihub_active_order_id');
        if (activeId && !localIds.includes(activeId)) {
          localIds.unshift(activeId);
        }
      } catch (e) {}

      const idsQuery = localIds.length ? `?ids=${encodeURIComponent(localIds.join(','))}` : '';
      const res = await fetch(`/api/user/orders${idsQuery}`, { credentials: 'include' });
      const orders = res.ok ? await res.json() : [];

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div class="p-10 text-center bg-stone-50 rounded-3xl border border-stone-200">
            <span class="text-4xl block mb-2">🥦</span>
            <h4 class="font-bold text-sm text-stone-800">No orders placed yet</h4>
            <p class="text-xs text-stone-500 mt-1">Explore our morning harvest and get farm-fresh produce delivered in 90 minutes.</p>
            <button onclick="closeAccountDashboard(); window.location.href='/#products-section';" class="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs">
              Shop Fresh Produce →
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = orders.map(order => {
        const targetId = order.id || order.orderId;
        const count = (order.items || []).reduce((acc, item) => acc + Number(item.quantity || item.qty || 1), 0);
        const st = order.status || order.orderStatus || 'CONFIRMED';
        const total = order.total !== undefined ? order.total : (order.totalAmount || 0);
        const isLive = !['DELIVERED', 'CANCELLED'].includes(st);
        const itemsSummary = (order.items || []).map(i => i.name || i.title).filter(Boolean).slice(0, 3).join(', ');

        return `
          <div class="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-emerald-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono font-bold text-xs text-stone-900">#${targetId}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getOrderBadgeColor(st)}">${st.replace(/_/g, ' ')}</span>
                ${isLive && order.deliveryOtp ? `
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    🔑 OTP: ${order.deliveryOtp}
                  </span>
                ` : ''}
              </div>
              <p class="text-xs text-stone-600 font-medium">
                ${count} ${count === 1 ? 'Item' : 'Items'} • Total: <strong class="text-stone-900 font-mono">₹${total}</strong>
                ${itemsSummary ? `<span class="text-stone-400 font-normal"> (${itemsSummary}${order.items?.length > 3 ? '...' : ''})</span>` : ''}
              </p>
              <div class="flex items-center gap-3 text-[10px] text-stone-400">
                <span>🕒 ${new Date(order.createdAt || Date.now()).toLocaleString()}</span>
                ${order.hubName ? `<span>📍 ${order.hubName}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="closeAccountDashboard(); openTrackOrderModal('${targetId}');" class="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition">
                Track Order
              </button>
              <button onclick="reorderCustomerOrder('${targetId}')" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs">
                Reorder ↺
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      container.innerHTML = '<div class="p-6 text-center text-rose-600 font-medium">Failed to load orders.</div>';
    }
  }
  window.loadDashboardOrders = loadDashboardOrders;

  function getOrderBadgeColor(status) {
    switch (status) {
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'OUT_FOR_DELIVERY':
      case 'OUT FOR DELIVERY': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'ARRIVED': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'READY_FOR_PICKUP':
      case 'PACKED': return 'bg-sky-100 text-sky-800 border border-sky-200';
      case 'PICKING':
      case 'QUALITY_CHECK': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ACCEPTED_BY_HUB': return 'bg-teal-100 text-teal-800 border border-teal-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'CONFIRMED':
      default: return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  }

  window.reorderCustomerOrder = async function(orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const order = await res.json();
        const currentCart = (typeof cart !== 'undefined') ? { ...cart } : {};

        (order.items || []).forEach(item => {
          const key = item.id || item.productId;
          if (currentCart[key]) {
            currentCart[key].qty += (item.quantity || 1);
          } else {
            currentCart[key] = {
              productId: item.productId || item.id,
              name: item.name || item.title,
              hindiName: item.hindiName || '',
              weightLabel: item.weightLabel || item.weight || '1 unit',
              price: item.price,
              originalPrice: item.originalPrice || item.price,
              image: item.image,
              qty: item.quantity || 1
            };
          }
        });

        if (typeof window.saveCartState === 'function') {
          window.saveCartState(currentCart);
        }
        if (typeof window.updateCartUI === 'function') {
          window.updateCartUI();
        }
        closeAccountDashboard();
        if (typeof window.openCartDrawer === 'function') {
          window.openCartDrawer();
        }
        showToast('Items added to basket! 🌱', 'success');
      }
    } catch (e) {
      showToast('Error reordering items', 'error');
    }
  };

  async function loadDashboardAddresses() {
    const container = document.getElementById('dash-addresses-list');
    if (!container) return;

    container.innerHTML = '<div class="p-8 text-center text-stone-400 font-medium">Loading saved addresses...</div>';

    try {
      const res = await fetch('/api/addresses', { credentials: 'include' });
      const addrs = res.ok ? await res.json() : [];

      if (!addrs || addrs.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200">
            <span class="text-3xl block mb-1">📍</span>
            <p class="text-xs text-stone-500">No addresses saved yet.</p>
            <button onclick="openAddressEditorModal()" class="mt-3 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold">
              + Add First Address
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = addrs.map(a => `
        <div class="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start justify-between gap-3">
          <div class="space-y-0.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="font-bold text-stone-900">${a.tag || 'Address'}</span>
              ${a.isDefault ? '<span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Default</span>' : ''}
            </div>
            <p class="text-stone-700 font-medium">${a.fullName || ''} • ${a.phone || ''}</p>
            <p class="text-stone-500">${a.flat || ''}, ${a.street || ''}, ${a.city || 'Bangalore'} - ${a.pincode || ''}</p>
          </div>
          <div class="flex items-center gap-1.5">
            ${!a.isDefault ? `<button onclick="setDefaultAddress('${a.id}')" class="text-[11px] font-bold text-emerald-700 hover:underline">Set Default</button>` : ''}
            <button onclick="deleteAddress('${a.id}')" class="text-[11px] font-bold text-rose-600 hover:underline ml-2">Delete</button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<div class="p-6 text-center text-rose-600">Error loading addresses.</div>';
    }
  }

  window.deleteAddress = async function(id) {
    if (!confirm('Remove this saved address?')) return;
    try {
      await fetch(`/api/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
      loadDashboardAddresses();
      showToast('Address removed', 'info');
    } catch (e) {}
  };

  window.setDefaultAddress = async function(id) {
    try {
      await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isDefault: true })
      });
      loadDashboardAddresses();
      showToast('Default delivery address updated', 'success');
    } catch (e) {}
  };

  async function loadDashboardWishlist() {
    const container = document.getElementById('dash-wishlist-list');
    if (!container) return;

    container.innerHTML = '<div class="p-8 text-center text-stone-400 font-medium">Loading your wishlist...</div>';

    try {
      const res = await fetch('/api/wishlist', { credentials: 'include' });
      const items = res.ok ? await res.json() : [];

      if (!items || items.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-stone-50 rounded-3xl border border-stone-200">
            <span class="text-3xl block mb-1">❤️</span>
            <p class="text-xs text-stone-500">Your wishlist is empty.</p>
            <button onclick="closeAccountDashboard(); window.location.href='/#products-section';" class="mt-3 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold">
              Explore Farm Produce
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = items.map(w => `
        <div class="p-3 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between gap-3">
          <span class="text-xs font-bold text-stone-800">${w.productId}</span>
          <button onclick="removeWishlistItem('${w.productId}')" class="text-xs text-rose-600 font-bold hover:underline">Remove</button>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<div class="p-6 text-center text-rose-600">Error loading wishlist.</div>';
    }
  }

  window.removeWishlistItem = async function(prodId) {
    try {
      await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: prodId })
      });
      loadDashboardWishlist();
      showToast('Item removed from wishlist', 'info');
    } catch (e) {}
  };

  function loadDashboardSecurity() {
    const user = window.sabjihubAuth.user;
    const googleStatus = document.getElementById('dash-google-status');
    const localStatus = document.getElementById('dash-local-status');

    if (googleStatus && user) {
      if (user.googleSub) {
        googleStatus.innerHTML = '<span class="text-emerald-700 font-bold">✓ Connected</span>';
      } else {
        googleStatus.innerHTML = '<span class="text-stone-400">Not Linked</span>';
      }
    }

    if (localStatus && user) {
      localStatus.innerHTML = user.passwordHash ? '<span class="text-emerald-700 font-bold">✓ Active Password</span>' : '<span class="text-amber-600 font-bold">Google Only</span>';
    }
  }

  window.submitChangePasswordDashboard = async function(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('dash-cur-pwd')?.value;
    const newPassword = document.getElementById('dash-new-pwd')?.value;
    const confirmPassword = document.getElementById('dash-confirm-pwd')?.value;
    const statusMsg = document.getElementById('dash-pwd-status');

    if (newPassword !== confirmPassword) {
      if (statusMsg) statusMsg.textContent = 'New passwords do not match.';
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Password updated successfully! 🔐', 'success');
        document.getElementById('dash-change-pwd-form')?.reset();
        if (statusMsg) statusMsg.textContent = '';
      } else {
        if (statusMsg) statusMsg.textContent = data.error || 'Failed to update password.';
      }
    } catch (err) {
      if (statusMsg) statusMsg.textContent = 'Error updating password.';
    }
  };

  /**
   * 12. Dynamic Modal DOM Injector
   * Ensures auth & dashboard modals exist on any page loading auth.js
   */
  window.openAddressEditorModal = function() {
    const modal = document.getElementById('dash-address-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.getElementById('dash-addr-name').value = window.sabjihubAuth.user?.name || '';
      document.getElementById('dash-addr-phone').value = window.sabjihubAuth.user?.phone || '';
    }
  };

  window.closeAddressEditorModal = function() {
    const modal = document.getElementById('dash-address-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.saveDashboardAddress = async function(e) {
    e.preventDefault();
    const tag = document.getElementById('dash-addr-tag')?.value || 'Home';
    const fullName = document.getElementById('dash-addr-name')?.value?.trim();
    const phone = document.getElementById('dash-addr-phone')?.value?.trim();
    const flat = document.getElementById('dash-addr-flat')?.value?.trim();
    const street = document.getElementById('dash-addr-street')?.value?.trim();
    const pincode = document.getElementById('dash-addr-pincode')?.value?.trim();
    const isDefault = document.getElementById('dash-addr-default')?.checked || false;

    if (!fullName || !phone || !flat || !street || !pincode) {
      showToast('Please fill in all address details.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tag, fullName, phone, flat, street, pincode, isDefault })
      });

      if (res.ok) {
        closeAddressEditorModal();
        loadDashboardAddresses();
        showToast('Address saved successfully! 📍', 'success');
        document.getElementById('dash-address-form')?.reset();
      } else {
        showToast('Failed to save address.', 'error');
      }
    } catch (err) {
      showToast('Network error saving address.', 'error');
    }
  };

  function ensureAuthModalsInDOM() {
    if (document.getElementById('auth-modal')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'sabjihub-auth-dom-root';
    modalContainer.innerHTML = `
      <!-- ================= AUTH MODAL (SIGN IN / REGISTER / RECOVERY) ================= -->
      <div id="auth-modal" class="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
        <div class="bg-[#fdfcf7] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200/80 relative max-h-[94vh] overflow-y-auto">
          <!-- Close Button -->
          <button onclick="closeAuthModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold" aria-label="Close modal">
            &times;
          </button>

          <!-- Modal Brand Header -->
          <div class="text-center mb-5">
            <div class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-md shadow-emerald-700/20 mb-2">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <h3 class="text-lg sm:text-xl font-heading font-black text-emerald-950">Welcome to Fresh<span class="text-emerald-600">Mart</span></h3>
            <p class="text-xs text-stone-500 mt-0.5">Farm fresh produce delivered in 90 minutes</p>
          </div>

          <!-- Error Banner -->
          <div class="auth-error-banner hidden text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 p-3 rounded-2xl mb-4 text-center"></div>

          <!-- Tab Bar (Sign In / Register) -->
          <div id="auth-tab-bar" class="flex p-1 bg-stone-100 rounded-2xl mb-4">
            <button id="auth-tab-signin" type="button" onclick="switchAuthView('signin')" class="flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-white text-stone-900 shadow-xs cursor-pointer">
              Sign In
            </button>
            <button id="auth-tab-register" type="button" onclick="switchAuthView('register')" class="flex-1 py-2 text-xs font-bold rounded-xl transition-all text-stone-500 hover:text-stone-900 cursor-pointer">
              Create Account
            </button>
          </div>

          <!-- VIEW 1: SIGN IN -->
          <div id="auth-view-signin" class="space-y-4">
            <!-- Official Google Sign-In Button Container -->
            <div class="flex flex-col items-center gap-2">
              <div id="google-signin-btn-container" class="min-h-[44px] flex items-center justify-center"></div>
              <div class="relative w-full text-center my-1">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-stone-200"></div></div>
                <span class="relative bg-[#fdfcf7] px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">or with email</span>
              </div>
            </div>

            <form onsubmit="submitSignIn(event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Email, Phone, or Employee ID</label>
                <input id="signin-email" type="text" required placeholder="name@example.com or 7300212948" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-bold text-stone-700">Password</label>
                  <button type="button" onclick="switchAuthView('forgot')" class="text-[11px] font-bold text-emerald-700 hover:underline">Forgot password?</button>
                </div>
                <input id="signin-password" type="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div class="flex items-center gap-2 pt-1">
                <input id="signin-remember" type="checkbox" checked class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300" />
                <label for="signin-remember" class="text-xs text-stone-600 font-medium">Remember this device</label>
              </div>

              <button id="signin-submit-btn" type="submit" class="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0d4a2b] via-[#093d22] to-[#062c18] hover:from-[#093d22] hover:to-[#042011] text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all active:scale-[0.99] cursor-pointer">
                Sign In
              </button>
            </form>
          </div>

          <!-- VIEW 2: CREATE ACCOUNT -->
          <div id="auth-view-register" class="space-y-4 hidden">
            <form onsubmit="submitRegister(event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <input id="reg-name" type="text" required placeholder="e.g. Rahul Sharma" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <input id="reg-email" type="email" required placeholder="you@example.com" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Phone Number <span class="text-stone-400 font-normal">(Optional)</span></label>
                <input id="reg-phone" type="tel" placeholder="+91 98765 43210" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Password</label>
                <input id="reg-password" type="password" required placeholder="At least 8 characters" oninput="checkPasswordStrength(this.value)" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                <!-- Password Strength Meter -->
                <div class="mt-1.5 space-y-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-stone-400 font-medium">Strength:</span>
                    <span id="pwd-strength-label" class="font-bold"></span>
                  </div>
                  <div class="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                    <div id="pwd-strength-bar" class="h-1.5 rounded-full transition-all duration-300 bg-stone-300" style="width: 0%;"></div>
                  </div>
                  <p id="pwd-strength-hint" class="text-[10px] text-stone-400">Must be at least 8 characters</p>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Confirm Password</label>
                <input id="reg-confirm-password" type="password" required placeholder="Re-enter password" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div class="flex items-start gap-2 pt-1">
                <input id="reg-terms" type="checkbox" required checked class="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300" />
                <label for="reg-terms" class="text-[11px] text-stone-600 leading-tight">
                  I agree to the <a href="#" class="text-emerald-700 font-bold hover:underline">Terms & Conditions</a> and <a href="#" class="text-emerald-700 font-bold hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button id="reg-submit-btn" type="submit" class="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0d4a2b] via-[#093d22] to-[#062c18] hover:from-[#093d22] hover:to-[#042011] text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition-all active:scale-[0.99] cursor-pointer">
                Create Account
              </button>
            </form>
          </div>

          <!-- VIEW 3: CHECK EMAIL (VERIFICATION SCREEN) -->
          <div id="auth-view-check-email" class="text-center py-4 space-y-4 hidden">
            <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✉️
            </div>
            <div>
              <h4 class="font-heading font-black text-lg text-emerald-950">Verify Your Email</h4>
              <p class="text-xs text-stone-500 mt-1">
                We've sent a verification link to<br>
                <strong id="check-email-address" class="text-stone-900 font-bold">you@example.com</strong>
              </p>
              <p class="text-[11px] text-stone-400 mt-2">
                Click the button in your email to activate your account and unlock 90-minute farm delivery.
              </p>
            </div>

            <div class="pt-2 space-y-2">
              <button id="resend-verification-btn" onclick="resendVerificationEmail()" class="w-full py-2.5 rounded-2xl border border-emerald-600 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors cursor-pointer">
                Resend Verification Email
              </button>
              <div id="resend-countdown" class="text-[11px] text-stone-400 font-medium"></div>
              <button type="button" onclick="switchAuthView('signin')" class="text-xs font-bold text-stone-500 hover:text-stone-800 pt-2 block mx-auto">
                ← Back to Sign In
              </button>
            </div>
          </div>

          <!-- VIEW 4: FORGOT PASSWORD -->
          <div id="auth-view-forgot" class="space-y-4 hidden">
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xl mx-auto mb-2">
                🔑
              </div>
              <h4 class="font-heading font-black text-base text-stone-900">Reset Your Password</h4>
              <p class="text-xs text-stone-500 mt-0.5">Enter your email and we'll send you a password reset link.</p>
            </div>

            <div id="forgot-success" class="hidden p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center"></div>

            <form onsubmit="submitForgotPassword(event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Registered Email Address</label>
                <input id="forgot-email" type="email" required placeholder="you@example.com" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <button id="forgot-submit-btn" type="submit" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer">
                Send Reset Link
              </button>

              <button type="button" onclick="switchAuthView('signin')" class="w-full py-2 text-center text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
                ← Back to Sign In
              </button>
            </form>
          </div>

          <!-- VIEW 5: RESET PASSWORD FORM -->
          <div id="auth-view-reset" class="space-y-4 hidden">
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto mb-2">
                🔐
              </div>
              <h4 class="font-heading font-black text-base text-stone-900">Create New Password</h4>
              <p class="text-xs text-stone-500 mt-0.5">Choose a secure new password for your FreshMart account.</p>
            </div>

            <form onsubmit="submitResetPassword(event)" class="space-y-3">
              <input id="reset-token-input" type="hidden" />
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">New Password</label>
                <input id="reset-password-input" type="password" required placeholder="At least 8 characters" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">Confirm New Password</label>
                <input id="reset-confirm-input" type="password" required placeholder="Re-enter new password" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <button id="reset-submit-btn" type="submit" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer">
                Update Password
              </button>
            </form>
          </div>

          <!-- VIEW 6: LINK GOOGLE ACCOUNT -->
          <div id="auth-view-link-google" class="space-y-4 hidden">
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-2xl mx-auto mb-2">
                🔗
              </div>
              <h4 class="font-heading font-black text-base text-stone-900">Link Google Account</h4>
              <p class="text-xs text-stone-600 mt-1">
                An account with <strong id="link-google-email" class="text-stone-900 font-bold"></strong> already exists.
              </p>
              <p class="text-[11px] text-stone-400 mt-1">
                Enter your existing FreshMart password to verify ownership and link Google sign-in.
              </p>
            </div>

            <form onsubmit="submitLinkGoogle(event)" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">FreshMart Password</label>
                <input id="link-google-password" type="password" required placeholder="Enter your password" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all" />
              </div>

              <button id="link-google-submit-btn" type="submit" class="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer">
                Verify & Link Google Account
              </button>

              <button type="button" onclick="switchAuthView('signin')" class="w-full py-2 text-center text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors">
                Cancel
              </button>
            </form>
          </div>

        </div>
      </div>

      <!-- ================= CUSTOMER ACCOUNT DASHBOARD MODAL ================= -->
      <div id="account-dashboard-modal" class="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 hidden">
        <div class="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
          
          <!-- LEFT SIDEBAR -->
          <div class="w-full md:w-64 bg-stone-50/90 border-b md:border-b-0 md:border-r border-stone-200/80 p-5 flex flex-col justify-between shrink-0">
            <div>
              <!-- User Profile Header -->
              <div class="flex items-center gap-3 pb-4 border-b border-stone-200/60 mb-4">
                <img id="dash-profile-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" class="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-600/30 shadow-xs" alt="User" />
                <div class="min-w-0 flex-1">
                  <h4 id="dash-profile-badge" class="text-xs font-black text-emerald-800 uppercase tracking-wider">Gold Farm Club</h4>
                  <p class="text-[11px] text-stone-500 mt-0.5">FreshMart Cash: <strong id="dash-profile-wallet" class="text-stone-900 font-mono">₹420</strong></p>
                </div>
              </div>

              <!-- Executive Owner Console Quick Access -->
              <a id="dash-owner-console-link" href="/owner" class="hidden mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-between border border-amber-300/40 cursor-pointer">
                <span class="flex items-center gap-2">
                  <span class="text-base">👑</span>
                  <span>Owner Console</span>
                </span>
                <span class="text-[10px] bg-stone-950/20 text-stone-950 px-2 py-0.5 rounded-full font-bold">Launch &rarr;</span>
              </a>

              <!-- Navigation Tabs -->
              <nav class="space-y-1 text-xs">
                <button id="dash-nav-profile" onclick="switchDashboardTab('profile')" class="dash-nav-btn w-full text-left px-3.5 py-2.5 rounded-2xl font-bold flex items-center gap-2.5 transition-colors cursor-pointer bg-emerald-50 text-emerald-900 border border-emerald-200">
                  <span>👤</span> Profile Details
                </button>
                <button id="dash-nav-orders" onclick="switchDashboardTab('orders')" class="dash-nav-btn w-full text-left px-3.5 py-2.5 rounded-2xl font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-2.5 transition-colors cursor-pointer">
                  <span>📦</span> My Orders
                </button>
                <button id="dash-nav-addresses" onclick="switchDashboardTab('addresses')" class="dash-nav-btn w-full text-left px-3.5 py-2.5 rounded-2xl font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-2.5 transition-colors cursor-pointer">
                  <span>📍</span> Saved Addresses
                </button>
                <button id="dash-nav-wishlist" onclick="switchDashboardTab('wishlist')" class="dash-nav-btn w-full text-left px-3.5 py-2.5 rounded-2xl font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-2.5 transition-colors cursor-pointer">
                  <span>❤️</span> Wishlist
                </button>
                <button id="dash-nav-security" onclick="switchDashboardTab('security')" class="dash-nav-btn w-full text-left px-3.5 py-2.5 rounded-2xl font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-2.5 transition-colors cursor-pointer">
                  <span>🔐</span> Login & Security
                </button>
              </nav>
            </div>

            <div class="pt-4 border-t border-stone-200/60 mt-4">
              <button onclick="handleCustomerLogout()" class="w-full py-2 px-3 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-2">
                <span>🚪</span> Sign Out
              </button>
            </div>
          </div>

          <!-- RIGHT CONTENT PANE -->
          <div class="flex-1 flex flex-col min-w-0 bg-white">
            <!-- Modal Header with Close -->
            <div class="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 class="font-heading font-black text-base sm:text-lg text-emerald-950">Customer Account Center</h3>
              <button onclick="closeAccountDashboard()" class="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold">
                &times;
              </button>
            </div>

            <!-- Scrollable Content Body -->
            <div class="p-4 sm:p-6 overflow-y-auto flex-1">
              
              <!-- PANE 1: PROFILE -->
              <div id="dash-pane-profile" class="dash-pane space-y-4">
                <div>
                  <h4 class="font-heading font-bold text-sm text-stone-900">Personal Information</h4>
                  <p class="text-xs text-stone-500">Update your account identity and contact details.</p>
                </div>

                <form onsubmit="saveDashboardProfile(event)" class="space-y-3 max-w-lg">
                  <div>
                    <label class="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                    <input id="dash-profile-name" type="text" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-stone-700 mb-1">Email Address <span class="text-stone-400 font-normal">(Verified Account)</span></label>
                    <input id="dash-profile-email" type="email" disabled class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-100 text-xs font-medium text-stone-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                    <input id="dash-profile-phone" type="tel" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10" />
                  </div>

                  <button type="submit" class="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer">
                    Save Changes
                  </button>
                </form>
              </div>

              <!-- PANE 2: ORDERS -->
              <div id="dash-pane-orders" class="dash-pane space-y-4 hidden">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-heading font-bold text-sm text-stone-900">Your Fresh Farm Orders</h4>
                    <p class="text-xs text-stone-500">Track current 90-minute deliveries or reorder favorite harvest baskets.</p>
                  </div>
                </div>

                <div id="dash-orders-list" class="space-y-3">
                  <!-- Orders injected via loadDashboardOrders() -->
                </div>
              </div>

              <!-- PANE 3: ADDRESSES -->
              <div id="dash-pane-addresses" class="dash-pane space-y-4 hidden">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-heading font-bold text-sm text-stone-900">Saved Delivery Addresses</h4>
                    <p class="text-xs text-stone-500">Manage drop-off locations for superfast delivery.</p>
                  </div>
                  <button onclick="openAddressEditorModal()" class="px-3.5 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer">
                    + Add New Address
                  </button>
                </div>

                <div id="dash-addresses-list" class="space-y-3">
                  <!-- Addresses injected via loadDashboardAddresses() -->
                </div>
              </div>

              <!-- PANE 4: WISHLIST -->
              <div id="dash-pane-wishlist" class="dash-pane space-y-4 hidden">
                <div>
                  <h4 class="font-heading font-bold text-sm text-stone-900">Saved Wishlist</h4>
                  <p class="text-xs text-stone-500">Produce saved for quick morning checkout.</p>
                </div>

                <div id="dash-wishlist-list" class="space-y-2">
                  <!-- Wishlist injected via loadDashboardWishlist() -->
                </div>
              </div>

              <!-- PANE 5: SECURITY -->
              <div id="dash-pane-security" class="dash-pane space-y-5 hidden">
                <div>
                  <h4 class="font-heading font-bold text-sm text-stone-900">Login & Account Security</h4>
                  <p class="text-xs text-stone-500">Manage authentication providers and password settings.</p>
                </div>

                <!-- Linked Accounts Status -->
                <div class="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3 max-w-lg">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="text-base">🌐</span>
                      <div>
                        <span class="font-bold text-stone-900 block">Google Identity</span>
                        <span class="text-[10px] text-stone-500">One-click secure Google Sign-In</span>
                      </div>
                    </div>
                    <div id="dash-google-status" class="text-xs"></div>
                  </div>

                  <div class="border-t border-stone-200/60 pt-3 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="text-base">🔑</span>
                      <div>
                        <span class="font-bold text-stone-900 block">Local Password</span>
                        <span class="text-[10px] text-stone-500">Encrypted with PBKDF2 (SHA-512)</span>
                      </div>
                    </div>
                    <div id="dash-local-status" class="text-xs"></div>
                  </div>
                </div>

                <!-- Change Password Form -->
                <form id="dash-change-pwd-form" onsubmit="submitChangePasswordDashboard(event)" class="space-y-3 max-w-lg">
                  <h5 class="font-bold text-xs text-stone-900">Change Account Password</h5>
                  <div>
                    <label class="block text-xs font-bold text-stone-700 mb-1">Current Password</label>
                    <input id="dash-cur-pwd" type="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-stone-700 mb-1">New Password</label>
                    <input id="dash-new-pwd" type="password" required placeholder="At least 8 characters" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-stone-700 mb-1">Confirm New Password</label>
                    <input id="dash-confirm-pwd" type="password" required placeholder="Re-enter new password" class="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10" />
                  </div>

                  <div id="dash-pwd-status" class="text-xs font-semibold text-rose-600"></div>

                  <button type="submit" class="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer">
                    Update Password
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- ================= QUICK ADDRESS MODAL ================= -->
      <div id="dash-address-modal" class="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 hidden">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-heading font-black text-base text-stone-900">Add Delivery Address</h4>
            <button onclick="closeAddressEditorModal()" class="text-stone-400 hover:text-stone-700 text-lg font-bold">&times;</button>
          </div>

          <form id="dash-address-form" onsubmit="saveDashboardAddress(event)" class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-stone-700 mb-1">Address Type</label>
              <select id="dash-addr-tag" class="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium">
                <option value="Home">Home 🏠</option>
                <option value="Work">Work 💼</option>
                <option value="Other">Other 📍</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-stone-700 mb-1">Recipient Name</label>
              <input id="dash-addr-name" type="text" required class="w-full px-3 py-2 rounded-xl border border-stone-200" placeholder="Full name" />
            </div>
            <div>
              <label class="block font-bold text-stone-700 mb-1">Mobile Number</label>
              <input id="dash-addr-phone" type="tel" required class="w-full px-3 py-2 rounded-xl border border-stone-200" placeholder="10-digit phone number" />
            </div>
            <div>
              <label class="block font-bold text-stone-700 mb-1">Flat / House No. / Building</label>
              <input id="dash-addr-flat" type="text" required class="w-full px-3 py-2 rounded-xl border border-stone-200" placeholder="e.g. Flat 402, Green Meadows" />
            </div>
            <div>
              <label class="block font-bold text-stone-700 mb-1">Street / Area / Landmark</label>
              <input id="dash-addr-street" type="text" required class="w-full px-3 py-2 rounded-xl border border-stone-200" placeholder="e.g. 12th Main, Indiranagar" />
            </div>
            <div>
              <label class="block font-bold text-stone-700 mb-1">Pincode</label>
              <input id="dash-addr-pincode" type="text" required class="w-full px-3 py-2 rounded-xl border border-stone-200" placeholder="560038" />
            </div>
            <div class="flex items-center gap-2 pt-1">
              <input id="dash-addr-default" type="checkbox" checked class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300" />
              <label for="dash-addr-default" class="text-xs text-stone-700 font-medium">Set as default delivery address</label>
            </div>

            <div class="pt-2 flex gap-2">
              <button type="button" onclick="closeAddressEditorModal()" class="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50">Cancel</button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800">Save Address</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);
  }

})();

