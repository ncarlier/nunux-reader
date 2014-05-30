var User   = require('../models/user'),
    errors = require('../helpers').errors;

module.exports = {
  /**
   * Get curent user infos.
   */
  get: function(req, res, next) {
    var providers = {};
    for (var p in req.user.providers) {
      var provider = req.user.providers[p];
      providers[p] = {access: provider.access_token !== null, expires_in: provider.expires_in};
    }
    return res.json({
      uid: req.user.uid,
      username: req.user.username,
      registrationDate: req.user.registrationDate,
      providers: providers
    });
  }
};
