var User    = require('../models/user'),
    errors  = require('../helpers').errors;
    logger  = require('../helpers').logger,
    request = require('request'),
    archive = require('../archive');

module.exports = {
  /**
   * Get all archive provider.
   */
  all: function(req, res, next) {
    var providers = [];
    for (p in archive.providers) {
      var provider = archive.providers[p];
      providers.push(provider.info());
    };
    res.json(providers);
  },

  /**
   * Save article to archive provider.
   */
  saveArticle: function(req, res, next) {
    var provider = archive.providers[req.params.provider];
    if (!provider) {
      return next('Archive provider not found: ' + req.params.provider);
    }

    provider.saveArticle(req.user, req.params.aid)
    .then(function(result) {
      res.json(result);
    }, next);
  },

  /**
   * Remove article from archive provider.
   */
  removeArticle: function(req, res, next) {
    var provider = archive.providers[req.params.provider];
    if (!provider) {
      return next('Archive provider not found: ' + req.params.provider);
    }

    provider.removeArticle(req.user, req.params.aid)
    .then(function(result) {
      res.json(result);
    }, next);
  },

  /**
   * Register OAuth code.
   */
  register: function(req, res, next) {
    if (!req.query.code && !req.query.error) {
      return next(new errors.BadRequest());
    }
    if (req.query.error) {
      return res.redirect('/#/profile?error=' + req.query.error);
    }
    var redirectURI = req.context.realm + '/api/archive/' + req.params.provider + '/register';
    archive.registerUserWithProvider(req.user, req.params.provider, req.query.code, redirectURI)
    .then(function(result) {
      var message = 'Registration with ' + req.params.provider + ' successfully completed.';
      res.redirect('/#/profile?info=' + encodeURIComponent(message));
    }, next);
  }
};
