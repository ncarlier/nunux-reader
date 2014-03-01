var db = require('../lib/db'),
    User = require('../lib/user'),
    async = require('async');

module.exports = function(app){
  /**
   * GET user timelines.
   */
  app.get('/api/timeline', app.ensureAuthenticated, function(req, res, next) {
    User.getAllTimelinesStatus(req.user.uid, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * GET user's timeline status.
   */
  app.get('/api/timeline/:timeline/status', app.ensureAuthenticated, function(req, res, next) {
    User.getTimelineStatus(req.user.uid, req.params.timeline, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * GET user's timeline.
   */
  app.get('/api/timeline/:timeline', app.ensureAuthenticated, function(req, res, next) {
    User.getTimeline(req.user.uid,
                     req.params.timeline,
                     req.query,
                     function(err, articles) {
      if (err) return next(err);
      res.json(articles);
    });
  });

  /**
   * DELETE article from user's timeline.
   */
  app.delete('/api/timeline/:timeline/:aid', app.ensureAuthenticated, function(req, res, next) {
    User.removeArticleFromTimeline(req.user.uid,
                            req.params.timeline,
                            req.params.aid,
                            function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * DELETE all article from user's timeline.
   */
  app.delete('/api/timeline/:timeline', app.ensureAuthenticated, function(req, res, next) {
    User.removeAllArticlesFromTimeline(req.user.uid,
                            req.params.timeline,
                            function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * PUT article into user's timeline.
   */
  app.put('/api/timeline/:timeline/:aid', app.ensureAuthenticated, function(req, res, next) {
    User.addArticleToTimeline(req.user.uid,
                       req.params.timeline,
                       req.params.aid,
                       function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });
};
