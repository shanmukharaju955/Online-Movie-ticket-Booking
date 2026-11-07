const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cineverse_super_secret_session_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days session
    }
  })
);

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CINEVERSE',
    timestamp: new Date().toISOString()
  });
});

// Custom 404 Page handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  const notFoundPath = path.join(__dirname, 'public', '404.html');
  if (fs.existsSync(notFoundPath)) {
    return res.status(404).sendFile(notFoundPath);
  }
  res.status(404).send('404 Not Found - CINEVERSE');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log('========================================================');
  console.log(`🎬 SHANMUKHA CINEVERSE - Online Movie Ticket Booking Platform`);
  console.log(`👨‍💻 Developed by: Shanmukha Raju`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================================');

  // Verify Database Connection
  await testConnection();
});
