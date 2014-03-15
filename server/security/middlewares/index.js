var errors = require('../../helpers').errors;

/**
 * Security Middlewares.
 * @module middlewares
 */
module.exports = {
  /**
   * Middleware to check that the user is logged.
   */
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    next(new errors.Forbidden());
  },
  /**
   * Middleware to check that the user is an admin.
   */
  ensureIsAdmin: function(req, res, next) {
    next(req.isAdmin() ? null : new errors.Unauthorized());
  }
};
