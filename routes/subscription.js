var db = require('../lib/db'),
    User = require('../lib/user'),
    async = require('async');

module.exports = function(app){
  /**
   * GET user subscriptions.
   */
  app.get('/subscription', app.ensureAuthenticated, function(req, res, next) {
    User.getSubscriptions(req.user.uid, function(err, feeds) {
      if (err) return next(err);
      res.json(feeds);
    });
  });

  /**
   * POST new subscitpion(s)
   */
  app.post('/subscription', app.ensureAuthenticated, function(req, res, next) {
    if (req.files && req.files.opml) {
      User.import(req.user.uid, req.files.opml.path, function(err, feeds) {
        if (err) return next(err);
        res.json(feeds);
      });
    } else if (req.body.url) {
      User.subscribe(req.user.uid, req.body.url, function(err, feed) {
        if (err) return next(err);
        res.json(feed);
      });
    } else {
      res.send(400);
    }
  });

  /**
   * DELETE user subscription.
   */
  app.delete('/subscription/:id', app.ensureAuthenticated, function(req, res, next) {
    User.unSubscribe(req.user.uid, req.params.id, function(err) {
      if (err) return next(err);
      res.send(204);
    });
  });

};
