var BrowserIDStrategy = require('passport-browserid').Strategy,
    User = require('../models/user');

/**
 * Browser ID configuration.
 */
module.exports = function(app, passport) {

  /**
   * Configure passport with Browser ID strategy.
   */
  passport.use(new BrowserIDStrategy({
    audience: app.get('realm')
  }, function(email, done) {
    var user = {
      uid: email,
      username: email
    };
    User.login(user, done);
  }));

  /**
   * Borwser ID auth entry point.
   */
  app.post('/auth/browserid', passport.authenticate('browserid', {
    successRedirect: '/', failureRedirect: '/welcome?error=unauthorized'
  }));
};
