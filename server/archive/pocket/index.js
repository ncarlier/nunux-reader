var qs      = require('querystring'),
    when    = require('when'),
    nodefn  = require('when/node/function'),
    request = require('request'),
    errors  = require('../../helpers').errors,
    logger  = require('../../helpers').logger,
    User    = require('../../models/user'),
    Article = require('../../models/article');


/**
 * Pocket archive provider.
 */
var PocketProvider = function() {
  this.config = {
    name: 'pocket',
    description: 'Pocket, previously known as Read It Later',
    url: 'http://getpocket.com/',
    key: process.env.APP_POCKET_KEY
  };
  if (!this.config.key) {
    logger.error('Unable to create Pocket archive provider. Configuration not set.');
    return null;
  }
  return this;
};

/**
 * Pocket registration request.
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
PocketProvider.prototype.registrationRequest = function(req, res, next) {
  var redirectURI = req.context.realm + '/api/archive/pocket/registration/callback';
  request.post({
    url: 'https://getpocket.com/v3/oauth/request',
    headers: {
      'X-Accept': 'application/json'
    },
    form: {
      consumer_key: this.config.key,
      redirect_uri: redirectURI
    }
  }, function(err, resp, body) {
    if (err) return next(err);
    if (resp.statusCode >= 400) return next(body);
    var data = JSON.parse(body);
    req.session.pocket = {
      code: data.code
    };
    res.redirect('https://getpocket.com/auth/authorize?' + qs.stringify({
      request_token: data.code,
      redirect_uri:  redirectURI
    }));
    res.end();
  });
};

/**
 * Pocket registration callback.
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
PocketProvider.prototype.registrationCallback = function(req, res, next) {
  if (!req.session.pocket || !req.session.pocket.code) {
    return next(new errors.BadRequest('No code in session.'));
  }
  var code = req.session.pocket.code;

  // Get access token
  request.post({
    url: 'https://getpocket.com/v3/oauth/authorize',
    headers: {
      'X-Accept': 'application/json'
    },
    form: {
      consumer_key: this.config.key,
      code: code
    }
  }, function(err, resp, body) {
    if (err) return next(err);
    if (resp.statusCode >= 400) return next(body);
    var data = JSON.parse(body);
    var access = {
      name: 'pocket',
      access_token: data.access_token,
      username: data.username
    };

    User.registerProvider(req.user, access, function(_err, user) {
      if (_err) return next(_err);
      logger.info('User (%s) Pocket infos updated: %j', user.uid, user.pocket);
      var message = 'Registration with Pocket successfully completed.';
      res.redirect('/#/profile?info=' + encodeURIComponent(message));
    });
  });
};

/**
 * Save an article into Pocket.
 * @param {Object} user User
 * @param {String} aid Article ID to save
 * @return {Promise} the promise of saving
 */
PocketProvider.prototype.saveArticle = function(user, aid) {
  logger.info('Saving article %s for user %s to Pocket...', aid, user.uid);
  if (!user.providers || !user.providers.pocket) {
    return when.reject('Pocket provider not registred for this user.');
  }
  var provider = user.providers.pocket,
      config = this.config;

  return nodefn.call(Article.get, aid)
  .then(function(article) {
    return nodefn.call(request.post, {
      url: 'https://getpocket.com/v3/add',
      headers: {
        'X-Accept': 'application/json'
      },
      form: {
        consumer_key: config.key,
        url: article.link,
        title: article.title,
        access_token: provider.access_token
      }
    }).then(function(args) {
      var body = JSON.parse(args[1]);
      return body.item ? when.resolve({
        ref: body.item,
        provider: 'pocket'
      }) : null;
    });
  });
};

/**
 * Remove article from Pocket.
 * @param {Object} user User
 * @param {String} aid Article ID to remove
 * @return {Promise} the promise of saving
 */
PocketProvider.prototype.removeArticle = function(user, aid) {
  logger.info('Removing article %s for user %s from Pocket...', aid, user.uid);
  // TODO
  return when.resolve(article);
};

/**
 * Get provider infos.
 * @return {Object} the provider infos
 */
PocketProvider.prototype.info = function() {
  return this.config;
};

module.exports = PocketProvider;

