var db = require('../lib/db'),
    User = require('../lib/user'),
    async = require('async');

module.exports = function(app){
  /**
   * GET user subscriptions.
   */
  app.get('/api/subscription', app.ensureAuthenticated, function(req, res, next) {
    User.getSubscriptions(req.user.uid, function(err, feeds) {
      if (err) return next(err);
      res.json(feeds);
    });
  });

  /**
   * GET user subscriptions in OPML format.
   */
  app.get('/api/subscription/export', app.ensureAuthenticated, function(req, res, next) {
    User.getSubscriptions(req.user.uid, function(err, feeds) {
      if (err) return next(err);
      res.attachment('subscriptions.xml');
      res.header("Content-Type", "application/octet-stream");
      res.render('opml', {uid: req.user.uid, feeds: feeds, info: app.get('info')});
    });
  });

  /**
   * POST new subscitpion(s)
   */
  app.post('/api/subscription', app.ensureAuthenticated, function(req, res, next) {
    if (req.files && Object.keys(req.files).length) {
      for(var file in req.files) {
        return User.importSubscriptions(req.user.uid, req.files[file].path, function(err, feeds) {
          if (err) return next(err);
          res.status(201).json(feeds);
        });
      }
    } else if (req.body.url) {
      User.subscribe(req.user.uid, req.body.url, function(err, feed) {
        if (err) return next(err);
        res.status(201).json(feed);
      });
    } else {
      res.send(400);
    }
  });

  /**
   * DELETE user subscription.
   */
  app.delete('/api/subscription/:id', app.ensureAuthenticated, function(req, res, next) {
    User.unSubscribe(req.user.uid, req.params.id, function(err) {
      if (err) return next(err);
      res.send(204);
    });
  });

};
