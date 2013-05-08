var db = require('../lib/db')
  , User = require('../lib/user')
  , async = require('async');

module.exports = function(app){
  /**
   * GET archives listing.
   */
  app.get('/archive', app.ensureAuthenticated, function(req, res, next) {
    User.getTimeline(req.user.uid, req.query.offset, req.query.size, true, function(err, articles) {
      if (err) return next(err);
      res.json(articles);
    });
  });

  /**
   * GET total archives.
   */
  app.get('/archive/total', app.ensureAuthenticated, function(req, res, next) {
    User.getTimelineSize(req.user.uid, true, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * Remove article from archives.
   */
  app.delete('/archive/:id', app.ensureAuthenticated, function(req, res, next) {
    User.unArchive(req.user.uid, req.params.id, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * Add article to archives.
   */
  app.put('/archive/:id', app.ensureAuthenticated, function(req, res, next) {
    User.archive(req.user.uid, req.params.id, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });
};
