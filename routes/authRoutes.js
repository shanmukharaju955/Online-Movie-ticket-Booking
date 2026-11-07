const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Default role is customer (unless admin email is configured specifically)
    const role = (email.toLowerCase() === 'admin@cineverse.com') ? 'admin' : 'customer';

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role, phone || null]
    );

    const newUser = {
      user_id: result.insertId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      phone: phone || null
    };

    // Auto-login after registration
    req.session.user = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to CINEVERSE.',
      user: newUser
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const [users] = await db.query(
      'SELECT user_id, name, email, password, role, phone FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Set session user (exclude password hash)
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: req.session.user
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Could not log out. Please try again.'
      });
    }
    res.clearCookie('connect.sid');
    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
});

// GET /api/auth/profile
router.get('/profile', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      success: true,
      isAuthenticated: true,
      user: req.session.user
    });
  }
  return res.json({
    success: true,
    isAuthenticated: false,
    user: null
  });
});

module.exports = router;
