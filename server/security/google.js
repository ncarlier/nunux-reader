var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    logger = require('../helpers').logger,
    User   = require('../models/user');

/**
 * Google auth provider configuration.
 */
module.exports = function(app, passport) {

  /**
   * Configure passport with Google strategy.
   */
  passport.use(new GoogleStrategy({
    clientID: process.env.APP_GOOGLE_KEY,
    clientSecret: process.env.APP_GOOGLE_SECRET,
    callbackURL: app.get('realm') + '/auth/google/callback',
  }, function(accessToken, refreshToken, profile, done) {
    var user = {
      uid: profile.emails[0].value,
      username: profile.displayName
    };
    User.login(user, done);
  }));

  /**
   * Google auth entry point.
   */
  app.get('/auth/google', passport.authenticate('google', {scope: 'profile email'}));

  /**
   * Google auth return URL.
   */
  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/', failureRedirect: '/welcome?error=unauthorized'
  }));

  logger.debug('using Google authentication provider')
};
