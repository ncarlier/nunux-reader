var db = require('../lib/db')
  , async = require('async');

module.exports = function(app){
  /**
   * GET user subscriptions.
   */
  app.get('/subscription', app.ensureAuthenticated, function(req, res, next) {
    var uid = req.user.uid;

    var getFeed = function(key, callback) {
      db.hgetall(key, callback);
    }

    db.smembers(User.getSubscriptionsKey(uid), function(err, replies) {
      if (err) return next(err);
      async.map(replies, getFeed, function(err, results){
        if (err) return next(err);
        res.json(results);
      });
    });
  });
};
