var User    = require('../models/user'),
    errors  = require('../helpers').errors,
    request = require('request'),
    archive = require('../archive');

module.exports = {
  /**
   * Get all archive provider.
   */
  all: function(req, res, next) {
    var providers = [];
    for (var p in archive.providers) {
      var provider = archive.providers[p];
      providers.push(provider.info());
    }
    res.json(providers);
  },

  /**
   * Assert provider from url param.
   */
  assertProvider: function(req, res, next) {
    var provider = archive.providers[req.params.provider];
    if (!provider) {
      return next('Archive provider not found: ' + req.params.provider);
    }
    next();
  },

  /**
   * Save article to archive provider.
   */
  saveArticle: function(req, res, next) {
    var provider = archive.providers[req.params.provider];
    provider.saveArticle(req.user, req.params.aid)
    .then(function(result) {
      res.json(result);
    }, next);
  },

  /**
   * Registration callback.
   */
  registrationRequest: function(req, res, next) {
    var provider = archive.providers[req.params.provider];
    provider.registrationRequest(req, res, next);
  },

  /**
   * Registration callback.
   */
  registrationCallback: function(req, res, next) {
    var provider = archive.providers[req.params.provider];
    provider.registrationCallback(req, res, next);
  }
};
