var db = require('../lib/db')
  , async = require('async');

module.exports = function(app){
  /**
   * GET user subscriptions.
   */
  app.get('/subscription', function(req, res, next) {
    var getFeed = function(key, callback) {
      db.hgetall(key, callback);
    }

    var key = 'user:nicolas@nunux.org:subscriptions';
    db.smembers(key, function(err, replies) {
      if (err) return next(err);
      async.map(replies, getFeed, function(err, results){
        if (err) return next(err);
        res.json(results);
      });
    });
  });
};
