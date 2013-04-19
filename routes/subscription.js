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
        res.json({result: 'ok'});
      });
    } else if (req.params.url) {
      res.json({result: 'TODO'});
    } else {
      res.send(400);
    }
  });
};
