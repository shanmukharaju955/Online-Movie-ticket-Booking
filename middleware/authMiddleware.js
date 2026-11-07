// Middleware to verify if a user is logged in
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  // If API request, return JSON 401
  if (req.xhr || req.headers.accept?.includes('json') || req.originalUrl.startsWith('/api/') || req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to proceed.'
    });
  }

  // Otherwise redirect to login page
  return res.redirect('/login.html?redirect=' + encodeURIComponent(req.originalUrl));
}

// Optional auth: attaches user info if session exists, but doesn't block
function optionalAuth(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
