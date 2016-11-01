var _       = require('underscore'),
    qs      = require('querystring'),
    url     = require('url'),
    when    = require('when'),
    nodefn  = require('when/node/function'),
    request = require('request'),
    errors  = require('../../helpers').errors,
    logger  = require('../../helpers').logger,
    User    = require('../../models/user'),
    Article = require('../../models/article'),
    KeeperSDK = require('node-keeper');

/**
 * Keeper V2 archive provider.
 */
var KeeperV2Provider = function() {
  this.config = {
    name:         'keeper-v2',
    description:  'Nunux Keeper V2',
    endpoint:     process.env.APP_KEEPER_V2_URL,
    clientId:     process.env.APP_KEEPER_V2_KEY,
    clientSecret: process.env.APP_KEEPER_V2_SECRET
  };

  if (!this.config.clientId || !this.config.clientSecret || !this.config.endpoint) {
    logger.error('Unable to create Keeper V2 archive provider. Configuration not set.');
    return null;
  }
  this.sdk = new KeeperSDK({debug: true})
  this.getClient = function(creds) {
    return this.sdk.createClient(this.config, creds)
  }.bind(this)
  return this;
};

/**
 * Keeper V2 registration request.
 * (Just a simple redirect)
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
KeeperV2Provider.prototype.registrationRequest = function(req, res, next) {
  var callback_url = req.context.realm + '/api/archive/keeper-v2/registration/callback';
  this.getClient().then(function(client) {
    res.redirect(client.getAuthorizeURL(callback_url))
  })
};

/**
 * Keeper registration callback.
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
KeeperV2Provider.prototype.registrationCallback = function(req, res, next) {
  if (!req.query.code && !req.query.error) {
    return next(new errors.BadRequest());
  }
  if (req.query.error) {
    return res.redirect('/#/profile?error=' + req.query.error);
  }
  var callback_url = req.context.realm + '/api/archive/keeper-v2/registration/callback';
  this.getClient().then(function(client) {
    return client.getTokens(callback_url, req.query.code)
  })
  .then(function(creds) {
    var access = {
      name: 'keeper-v2',
      access_token: creds.accessToken,
      token_type: creds.tokenType,
      expires_in: creds.expiresIn,
      refresh_token: creds.refreshToken
    };
    var registration = when.defered;
    User.registerProvider(req.user, access, function(_err, user) {
      if (_err) return next(_err);
      logger.info('User (%s) Keeper V2 infos updated: %j', user.uid, user['keeper-v2']);
      var message = 'Registration with Keeper V2 successfully completed.';
      res.redirect('/#/profile?info=' + encodeURIComponent(message));
    });
  })
  .catch(next);
};

/**
 * Save article to Keeper.
 * @param {Object} user User
 * @param {String} aid Article ID to save
 * @return {Promise} the promise of saving
 */
KeeperV2Provider.prototype.saveArticle = function(user, aid) {
  logger.info('Saving article %s for user %s to Keeper V2...', aid, user.uid);
  if (!user.providers || !user.providers['keeper-v2']) {
    return when.reject('Keeper V2 provider not registred.');
  }
  var provider = user.providers['keeper-v2'];
  var config = {
    accessToken: provider.access_token,
    expiresIn: provider.expires_in,
    tokenType: provider.token_type,
    refreshToken: provider.refresh_token
  };

  return this.getClient(config)
  .then(function(client) {
    return nodefn.call(Article.get, aid)
    .then(function(article) {
      // filter link if exist
      var link = article.link;
      if (link && article.meta.link && !/^https?|file|ftps?/i.test(link)) {
        link = url.resolve(article.meta.link, link);
      }

      return client.api.document.post({
        title: article.title,
        origin: article.link,
        content: article.description,
        contentType: 'text/html'
      }).then(function(data) {
        return when.resolve({
          ref: data.id,
          provider: 'keeper-v2'
        });
      }).catch(function(err) {
        logger.error('Unable to save article %s in Keeper V2: %s', article.id, err);
        return when.reject(new errors.BadGateway(err));
      });
    });
  });
};

/**
 * Get provider infos.
 * @return {Object} the provider infos
 */
KeeperV2Provider.prototype.info = function() {
  return _.omit(this.config, 'clientSecret');
};


module.exports = KeeperV2Provider;

