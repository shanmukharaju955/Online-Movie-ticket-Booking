// Middleware to protect admin-only routes
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  // If unauthorized API request
  if (req.xhr || req.headers.accept?.includes('json') || req.originalUrl?.startsWith('/api/') || req.path.startsWith('/api/')) {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Administrator privileges required.'
    });
  }

  // Redirect unauthorized users to login with notice
  return res.redirect('/login.html?error=admin_required');
}

module.exports = {
  requireAdmin
};
