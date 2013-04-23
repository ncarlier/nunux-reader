var db = require('../lib/db')
  , User = require('../lib/user')
  , async = require('async');

module.exports = function(app){
  /**
   * GET article listing.
   */
  app.get('/article', app.ensureAuthenticated, function(req, res, next) {
    User.getTimeline(req.user.uid, req.query.offset, req.query.size, function(err, articles) {
      if (err) return next(err);
      res.json(articles);
    });
  });

  /**
   * GET total articles.
   */
  app.get('/article/total', app.ensureAuthenticated, function(req, res, next) {
    User.getTimelineSize(req.user.uid, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * Remove article from timeline.
   */
  app.delete('/article/:id', app.ensureAuthenticated, function(req, res, next) {
    User.read(req.user.uid, req.params.id, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * Restore article to timeline.
   */
  app.put('/article/:id', app.ensureAuthenticated, function(req, res, next) {
    User.unRead(req.user.uid, req.params.id, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });
};
