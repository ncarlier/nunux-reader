var errors   = require('../helpers').errors,
    logger   = require('../helpers').logger,
    User     = require('../models/user'),
    express  = require('express'),
    passport = require('passport'),
    crypto   = require('crypto'),
    http     = require('http'),
    request  = http.IncomingMessage.prototype;

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
var withPassport = function(app) {
  // Init. cookie middleware.
  app.use(express.cookieParser());
  app.use(express.cookieSession({
    key: 'reader.sess',
    secret: process.env.APP_SESSION_SECRET || 'NuNUXReAdR_'
  }));

  // Init. passport middleware
  app.use(passport.initialize());
  app.use(passport.session());


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
    require('./google')(app, passport);
  }


  // Return transparent middleware
  return function (req, res, next) {
    next();
  }
};

var withAuthProxy = function(app) {
  logger.debug('using proxy authentication provider')
  return function (req, res, next) {
    var authProxyHeader = process.env.APP_AUTH_PROXY_HEADER.toLowerCase();
    var username = req.headers[authProxyHeader]
    if (username) {
      logger.debug('extracted username: %s', username)
      var uid = crypto.createHash('md5').update(username).digest("hex");
      var user = {uid: uid, username: username};
      User.login(user, function(err, u) {
        if (err) return next(err);
        req.user = u;
        next();
      })
    } else {
      return next(new errors.Forbidden());
    }
  }
}


var configure = function (app) {
  var authProxyHeader = process.env.APP_AUTH_PROXY_HEADER;
  if (authProxyHeader != null && authProxyHeader !== '') {
    return withAuthProxy(app);
  }
  return withPassport(app);
};


module.exports = {
  /**
   * Middleware that handle the security.
   */
  configure: configure,
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


