var db = require('../lib/db'),
    User = require('../lib/user'),
    async = require('async');

module.exports = function(app){
  /**
   * GET user timelines.
   */
  app.get('/timeline', app.ensureAuthenticated, function(req, res, next) {
    User.getAllTimelinesStatus(req.user.uid, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * GET user's timeline status.
   */
  app.get('/timeline/:timeline/status', app.ensureAuthenticated, function(req, res, next) {
    User.getTimelineStatus(req.user.uid, req.params.timeline, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * GET user's timeline.
   */
  app.get('/timeline/:timeline', app.ensureAuthenticated, function(req, res, next) {
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
  app.delete('/timeline/:timeline/:aid', app.ensureAuthenticated, function(req, res, next) {
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
  app.delete('/timeline/:timeline', app.ensureAuthenticated, function(req, res, next) {
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
  app.put('/timeline/:timeline/:aid', app.ensureAuthenticated, function(req, res, next) {
    User.addArticleToTimeline(req.user.uid,
                       req.params.timeline,
                       req.params.aid,
                       function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });
};
