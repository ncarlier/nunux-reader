var errors  = require('../helpers').errors,
    logger  = require('../helpers').logger,
    User    = require('../models/user'),
    http    = require('http'),
    request = http.IncomingMessage.prototype;

/**
 * Test if request is done by an Admin.
 *
 * @return {Boolean}
 * @api public
 */
request.isAdmin = function() {
  return this.user && this.user.uid === process.env.APP_ADMIN;
};

/**
 * Security application configuration.
 */
module.exports = function(app, passport) {
  /**
   * Serialize user.
   */
  passport.serializeUser(function(user, done) {
    done(null, user.uid);
  });

  /**
   * Deserialize user.
   */
  passport.deserializeUser(function(uid, done) {
    User.login({uid: uid}, done);
  });

  /**
   * Logout route.
   */
  app.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
  });


  if (process.env.APP_GOOGLE_KEY && process.env.APP_GOOGLE_SECRET) {
    // Register Google auth provider.
    return require('./google')(app, passport);
  }

  // Return transparent middleware
  logger.warn('using NO authentication provider!')
  return function (req, res, next) {
    next();
  };
};
