/**
 * CINEVERSE - Authentication & Form Validation (auth.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
});

// ========================================================
// Login Form Logic
// ========================================================
function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');

  // Quick Demo Buttons
  const fillAdminBtn = document.getElementById('fill-admin-demo');
  if (fillAdminBtn) {
    fillAdminBtn.addEventListener('click', () => {
      emailInput.value = 'admin@cineverse.com';
      passwordInput.value = 'Admin@123';
      showToast('Admin demo credentials populated.', 'info');
    });
  }

  const fillCustomerBtn = document.getElementById('fill-customer-demo');
  if (fillCustomerBtn) {
    fillCustomerBtn.addEventListener('click', () => {
      emailInput.value = 'customer@example.com';
      passwordInput.value = 'Customer@123';
      showToast('Customer demo credentials populated.', 'info');
    });
  }

  // Handle Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Login successful!', 'success');

        // Check redirect query param
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect');

        setTimeout(() => {
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else if (data.user && data.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 800);
      } else {
        showToast(data.message || 'Login failed. Please check your credentials.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Server connection error: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Cineverse';
    }
  });
}

// ========================================================
// Register Form Logic
// ========================================================
function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const phoneInput = document.getElementById('reg-phone');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('reg-confirm-password');
  const submitBtn = document.getElementById('register-submit-btn');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!name || !email || !password) {
      showToast('Name, email, and password are required.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, confirmPassword })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('🎉 Account created! Welcome to CINEVERSE.', 'success');
        setTimeout(() => {
          window.location.href = 'movies.html';
        }, 1000);
      } else {
        showToast(data.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      showToast('Server connection error: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
    }
  });
}
