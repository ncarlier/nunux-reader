var User = require('../models/user');

module.exports = {
  /**
   * Get user subscriptions.
   */
  get: function(req, res, next) {
    User.getSubscriptions(req.user.uid, function(err, feeds) {
      if (err) return next(err);
      res.json(feeds);
    });
  },

  /**
   * Download user subscriptions in OPML format.
   */
  download: function(req, res, next) {
    User.getSubscriptions(req.user.uid, function(err, feeds) {
      if (err) return next(err);
      res.attachment('subscriptions.xml');
      res.header("Content-Type", "application/octet-stream");
      res.render('opml', {uid: req.user.uid, feeds: feeds, info: req.context.info});
    });
  },

  /**
   * Create new subscitpion(s).
   */
  create: function(req, res, next) {
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
  },

  /**
   * Remove user subscription.
   */
  remove: function(req, res, next) {
    User.unSubscribe(req.user.uid, req.params.id, function(err) {
      if (err) return next(err);
      res.send(204);
    });
  }
};
