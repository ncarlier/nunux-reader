var User   = require('../models/user'),
    errors = require('../helpers').errors;

module.exports = {
  /**
   * Update user configuration.
   */
  updateConfig: function(req, res, next) {
    if (req.params.uid !== req.user.uid) {
      return next(new errors.Forbidden());
    }
    User.updateConfig(req.user,
                      req.body,
                      function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  }
};
