var _       = require('underscore'),
    qs      = require('querystring'),
    when    = require('when'),
    nodefn  = require('when/node/function'),
    request = require('request'),
    errors  = require('../../helpers').errors,
    logger  = require('../../helpers').logger,
    User    = require('../../models/user'),
    Article = require('../../models/article');


var escapePath = function(p) {
  var p = encodeURIComponent(p)
  .replace(/%2F/g, '/')
  .replace(/\)/g, '%29')
  .replace(/\(/g, '%28')
  .replace(/!/g,'%21');
  if (p[0] === '/') { p = p.slice(1); }
  return p;
}

/**
 * Dropbox archive provider.
 */
var DropboxProvider = function() {
  this.config = {
    name:        'dropbox',
    description: 'Dropbox',
    url:         'https://www.dropbox.com',
    key:         process.env.APP_DROPBOX_KEY,
    secret:      process.env.APP_DROPBOX_SECRET
  };

  if (!this.config.key || !this.config.secret) {
    logger.error('Unable to create Dropbox archive provider. Configuration not set.');
    return null;
  }
  return this;
};

/**
 * Dropbox registration request.
 * (Just a simple redirect)
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
DropboxProvider.prototype.registrationRequest = function(req, res, next) {
  var redirectURI = req.context.realm + '/api/archive/dropbox/registration/callback';
  res.redirect('https://www.dropbox.com/1/oauth2/authorize?' + qs.stringify({
    response_type: 'code',
    client_id:     this.config.key,
    redirect_uri:  redirectURI
  }));
  res.end();
};

/**
 * Dropbox registration callback.
 * @param {Object} req HTTP request
 * @param {Object} res HTTP response
 * @param {Function} next callback
 */
DropboxProvider.prototype.registrationCallback = function(req, res, next) {
  if (!req.query.code && !req.query.error) {
    return next(new errors.BadRequest());
  }
  if (req.query.error) {
    return res.redirect('/#/profile?error=' + req.query.error_description);
  }
  var redirectURI = req.context.realm + '/api/archive/dropbox/registration/callback',
      code = req.query.code;
  // Get access token
  request.post({
    url: 'https://api.dropbox.com/1/oauth2/token',
    form: {
      grant_type: 'authorization_code',
      client_id: this.config.key,
      client_secret: this.config.secret,
      code: code,
      redirect_uri:  redirectURI
    }
  }, function(err, resp, body) {
    if (err) return next(err);
    if (resp.statusCode >= 400) return next(body);
    var data = JSON.parse(body);
    var access = {
      name: 'dropbox',
      access_token: data.access_token,
      token_type: data.token_type,
      uid: data.uid
    };
    var registration = when.defered;
    User.registerProvider(req.user, access, function(_err, user) {
      if (_err) return next(_err);
      logger.info('User (%s) Dropbox infos updated: %j', user.uid, user.dropbox);
      var message = 'Registration with Dropbox successfully completed.';
      res.redirect('/#/profile?info=' + encodeURIComponent(message));
    });
  });
};

/**
 * Save article to Dropbox.
 * @param {Object} user User
 * @param {String} aid Article ID to save
 * @return {Promise} the promise of saving
 */
DropboxProvider.prototype.saveArticle = function(user, aid) {
  logger.info('Saving article %s for user %s to Dropbox...', aid, user.uid);
  if (!user.providers || !user.providers.dropbox) {
    return when.reject('Dropbox provider not registred.');
  }
  var provider = user.providers.dropbox,
      config = this.config;
  return nodefn.call(Article.get, aid).then(function(article) {
    var filename = escapePath(article.title);
    logger.debug('Creating Dropbox file: %s...', filename);
    return nodefn.call(request.put, {
      url: 'https://api-content.dropbox.com/1/files_put/sandbox/' + filename + '.html',
      headers: {
        Authorization: 'Bearer ' + provider.access_token,
        'Content-Length': article.description.length
      },
      body : article.description
    }).then(function(args) {
      var resp = JSON.parse(args[1]);
      if (resp.error) {
        logger.error('Unable to savec article %s in Dropbox: %s', article.id, resp.error);
        return when.reject(new errors.BadGateway(resp.error));
      }
      return when.resolve({
        ref: resp.rev,
        provider: 'dropbox'
      });
    });
  });
};

/**
 * Get provider infos.
 * @return {Object} the provider infos
 */
DropboxProvider.prototype.info = function() {
  return _.omit(this.config, 'secret');
};


module.exports = DropboxProvider;

