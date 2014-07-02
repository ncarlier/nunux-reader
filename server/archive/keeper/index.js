var _       = require('underscore'),
    qs      = require('querystring'),
    when    = require('when'),
    nodefn  = require('when/node/function'),
    request = require('request'),
    errors  = require('../../helpers').errors,
    logger  = require('../../helpers').logger,
    User    = require('../../models/user'),
    Article = require('../../models/article');

/**
 * Keeper archive provider.
 */
var KeeperProvider = function() {
  this.config = {
    name:        'keeper',
    description: 'Nunux Keeper',
    url:         process.env.APP_KEEPER_URL,
    key:         process.env.APP_KEEPER_KEY,
    secret:      process.env.APP_KEEPER_SECRET
  };

  if (!this.config.key || !this.config.secret || !this.config.url) {
    logger.error('Unable to create Keeper archive provider. Configuration not set.');
    return null;
  }
  return this;
};

/**
 * Keeper registration request.
 * (Just a simple redirect)
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
KeeperProvider.prototype.registrationRequest = function(req, res, next) {
  var redirectURI = req.context.realm + '/api/archive/keeper/registration/callback';
  res.redirect(this.config.url + '/oauth/authorize?' + qs.stringify({
    response_type: 'code',
    client_id:     this.config.key,
    redirect_uri:  redirectURI
  }));
  res.end();
};

/**
 * Keeper registration callback.
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
KeeperProvider.prototype.registrationCallback = function(req, res, next) {
  if (!req.query.code && !req.query.error) {
    return next(new errors.BadRequest());
  }
  if (req.query.error) {
    return res.redirect('/#/profile?error=' + req.query.error);
  }
  var redirectURI = req.context.realm + '/api/archive/keeper/register',
      code = req.query.code;
  // Get access token
  request.post({
    url: this.config.url + '/oauth/token',
    auth: {
      user: this.config.key,
      pass: this.config.secret,
      sendImmediately: false
    },
    form: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectURI
    }
  }, function(err, resp, body) {
    if (err) return next(err);
    if (resp.statusCode >= 400) return next(body);
    var data = JSON.parse(body);
    var access = {
      name: 'keeper',
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    };
    var registration = when.defered;
    User.registerProvider(user, access, function(_err, user) {
      if (_err) return next(_err);
      logger.info('User (%s) Pocket infos updated: %j', user.uid, user.pocket);
      var message = 'Registration with Keeper successfully completed.';
      res.redirect('/#/profile?info=' + encodeURIComponent(message));
    });
  });
};

/**
 * Save article to Keeper.
 * @param {Object} user User
 * @param {String} aid Article ID to save
 * @return {Promise} the promise of saving
 */
KeeperProvider.prototype.saveArticle = function(user, aid) {
  logger.info('Saving article %s for user %s to Keeper...', aid, user.uid);
  if (!user.providers || !user.providers.keeper) {
    return when.reject('Keeper provider not registred.');
  }
  var provider = user.providers.keeper,
      config = this.config;
  return nodefn.call(Article.get, aid).then(function(article) {
    return nodefn.call(request.post, {
      url: config.url + '/api/document',
      headers: {
        Authorization: provider.token_type + ' ' + provider.access_token,
        'Content-Type': 'text/html'
      },
      qs: {
        title: article.title,
        link: article.link
      },
      body : article.description
    }).then(function(args) {
      var doc = JSON.parse(args[1]);
      return when.resolve({
        ref: doc._id,
        provider: 'keeper'
      });
    });
  });
};

/**
 * Get provider infos.
 * @return {Object} the provider infos
 */
KeeperProvider.prototype.info = function() {
  return _.omit(this.config, 'secret');
};


module.exports = KeeperProvider;

