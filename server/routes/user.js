var db = require('../lib/db'),
    User = require('../lib/user');

module.exports = function(app) {
  /**
   * PUT user configuration.
   */
  app.put('/api/user/:uid/config', app.ensureAuthenticated, function(req, res, next) {
    if (req.params.uid !== req.user.uid) {
      return next(new errors.Forbidden());
    }
    User.updateConfig(req.user,
                      req.body,
                      function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });
};
