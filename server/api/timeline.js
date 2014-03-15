var User = require('../models/user');

module.exports = {
  /**
   * Get user timelines.
   */
  all: function(req, res, next) {
    User.getAllTimelinesStatus(req.user.uid, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  },

  /**
   * Get user's timeline status.
   */
  status: function(req, res, next) {
    User.getTimelineStatus(req.user.uid, req.params.timeline, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  },

  /**
   * Get user's timeline.
   */
  get: function(req, res, next) {
    User.getTimeline(req.user.uid,
                     req.params.timeline,
                     req.query,
                     function(err, articles) {
      if (err) return next(err);
      res.json(articles);
    });
  },

  /**
   * Remove article from user's timeline.
   */
  removeArticle: function(req, res, next) {
    User.removeArticleFromTimeline(req.user.uid,
                            req.params.timeline,
                            req.params.aid,
                            function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  },

  /**
   * Remove all article from user's timeline.
   */
  removeAllArticles: function(req, res, next) {
    User.removeAllArticlesFromTimeline(req.user.uid,
                            req.params.timeline,
                            function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  },

  /**
   * Add article into user's timeline.
   */
  addArticle: function(req, res, next) {
    User.addArticleToTimeline(req.user.uid,
                       req.params.timeline,
                       req.params.aid,
                       function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  }
};
