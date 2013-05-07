var db = require('../lib/db')
  , User = require('../lib/user')
  , async = require('async');

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

  app.post('/subscription', app.ensureAuthenticated, function(req, res, next) {
    if (req.files.opml) {
      User.import(req.user.uid, req.files.opml.path, function(err) {
        if (err) return next(err);
        res.redirect('/');
      });
    } else if (req.params.url) {
      User.subscribe(req.user.uid, req.params.url, function(err, feed) {
        if (err) return next(err);
        res.redirect('/#feed/' + feed.id);
      });
    } else {
      res.send(400);
    }
  });
};
