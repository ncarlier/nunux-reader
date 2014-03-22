var when    = require('when'),
    request = require('request'),
    User    = require('../models/user'),
    KeeperProvider = require('./keeper');

var providers = {
  keeper: new KeeperProvider()
};

var registerUserWithProvider = function(user, providerName, code, redirectURI) {
  var provider = providers[providerName];
  if (!provider) {
    return when.reject('Archive provider not found: ' + providerName);
  }

  var registered = when.defer();
  request.post({
    url: provider.url + '/oauth/token',
    auth: {
      user: provider.key,
      pass: provider.secret,
      sendImmediately: false
    },
    form: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectURI
    }
  }, function(err, res, body) {
    if (err) return registered.reject(err);
    body = JSON.parse(body);
    if (!body.access_token) return registered.reject(body);
    var access = {
      name: providerName,
      access_token: body.access_token,
      token_type: body.token_type,
      expires_in: body.expires_in
    };
    User.registerProvider(user, access, function(err, result) {
      if (err) return registered.reject(err);
      registered.resolve(result);
    });
  });
  return registered.promise;
};

module.exports = {
  providers: providers,
  registerUserWithProvider: registerUserWithProvider
};
