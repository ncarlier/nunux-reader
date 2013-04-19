var db = require('../lib/db')
  , User = require('../lib/user')
  , async = require('async');

module.exports = function(app){
  /**
   * GET article listing.
   */
  app.get('/article', app.ensureAuthenticated, function(req, res, next) {
    var uid = req.user.uid;

    var getArticle = function(key, callback) {
      db.get(key, function(err, article) {
        if (err) return callback(err);
        callback(null, JSON.parse(article));
      });
    }

    db.zrangebyscore(User.getTimelineKey(uid), '-inf', '+inf', 'LIMIT', req.query.offset, req.query.size, function(err, replies) {
      if (err) return next(err);
      async.map(replies, getArticle, function(err, results){
        if (err) return next(err);
        res.json(results);
      });
    });
  });

  /**
   * GET total articles.
   */
  app.get('/article/total', app.ensureAuthenticated, function(req, res, next) {
    var uid = req.user.uid;
    db.zcount(User.getTimelineKey(uid), '-inf', '+inf', function(err, reply) {
      if (err) return next(err);
      res.json({total: reply});
    });
  });

  /**
   * PUT article read status.
   */
  app.delete('/article/:id', app.ensureAuthenticated, function(req, res, next) {
    var uid = req.user.uid;
    db.zrem(User.getTimelineKey(uid), req.params.id, function(err, reply) {
      if (err) return next(err);
      res.json({removed: reply});
    });
  });
};
