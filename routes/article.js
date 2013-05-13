var db = require('../lib/db')
  , User = require('../lib/user')
  , async = require('async');

module.exports = function(app){
  /**
   * GET article listing.
   */
  app.get('/article', app.ensureAuthenticated, function(req, res, next) {
    User.getGlobalTimeline(req.user.uid, req.query.next, req.query.size, 'ASC', function(err, articles) {
      if (err) return next(err);
      res.json(articles);
    });
  });

  /**
   * GET total articles.
   */
  app.get('/article/total', app.ensureAuthenticated, function(req, res, next) {
    User.getGlobalTimelineSize(req.user.uid, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * Remove article from timeline.
   */
  app.delete('/article/:id', app.ensureAuthenticated, function(req, res, next) {
    User.removeFromGlobalTimeline(req.user.uid, req.params.id, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * Restore article to timeline.
   */
  app.put('/article/:id', app.ensureAuthenticated, function(req, res, next) {
    User.restoreToGlobalTimeline(req.user.uid, req.params.id, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });
};
