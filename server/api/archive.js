var User   = require('../models/user'),
    archiveProvider = require('../archive');

module.exports = {
  /**
   * Get all archive provider.
   */
  all: function(req, res, next) {
    var providers = [];
    for (p in archiveProvider) {
      providers.push(archiveProvider[p]().info());
    };
    res.json(providers);
  },
  /**
   * Save article to archive provider.
   */
  save: function(req, res, next) {
    User.saveArticle(req.user,
                     req.params.aid,
                     function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  }
};
