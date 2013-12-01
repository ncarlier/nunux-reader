var db = require('../lib/db'),
    User = require('../lib/user'),
    Feed = require('../lib/feed'),
    async = require('async');

module.exports = function(app){
  /**
   * GET statistics.
   */
  app.get('/api/admin/stats', app.ensureAuthenticated, app.ensureIsAdmin, function(req, res, next) {
    var stats = {};
    async.waterfall(
      [
        function(callback) {
          // Get all users
          User.getAll(callback);
        },
        function(uids, callback) {
          stats.users = [];

          // Get users stats.
          var getUserStats = function(uid, next) {
            User.getAllTimelinesStatus(uid, function(err, result) {
              if (err) return next(err);
              var userStats = {};
              userStats[uid] = {
                timelines: result.length
              };
              userStats[uid][result[0].timeline] = result[0].size;
              userStats[uid][result[1].timeline] = result[1].size;
              stats.users.push(userStats);
              next(null);
            });
          };
          async.each(uids, getUserStats, callback);
        },
        function(callback) {
          // Get all feed status
          Feed.getAll(callback);
        },
        function(fids, callback) {
          stats.feeds = [];

          var getFeedStats = function(fid, next) {
            Feed.get(fid, function(err, feed) {
              if (err) return next(err);
              var feedStats = {};
              feedStats[feed.id] = feed.status;
              stats.feeds.push(feedStats)
              next(null);
            });
          };
          async.each(fids, getFeedStats, callback);
        },
        function() {
          res.json(stats);
        }
      ],
      function(err) {
        next(err);
      }
    );
  });

  /**
   * GET user.
   */
  app.get('/api/admin/user/:email', app.ensureAuthenticated, app.ensureIsAdmin, function(req, res, next) {
    User.find(req.params.email, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

  /**
   * POST new user.
   */
  app.post('/api/admin/user/:email', app.ensureAuthenticated, app.ensureIsAdmin, function(req, res, next) {
    User.create({uid: req.params.email}, function(err, result) {
      if (err) return next(err);
      res.status(201).json({msg: 'User ' + req.params.email + ' created.'});
    });
  });

  /**
   * DELETE user.
   */
  app.delete('/api/admin/user/:email', app.ensureAuthenticated, app.ensureIsAdmin, function(req, res, next) {
    User.del(req.params.email, function(err, result) {
      if (err) return next(err);
      res.status(205).json({msg: 'User ' + req.params.email + ' deleted.'});
    });
  });

};
