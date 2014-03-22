var when    = require('when'),
    nodefn  = require('when/node/function'),
    request = require('request'),
    logger  = require('../../helpers/logger'),
    Article = require('../../models/article');

/**
 * Keeper archive provider.
 */
var KeeperProvider = function() {
  this.name = 'keeper';
  this.description = 'Nunux Keeper';
  this.url = process.env.APP_KEEPER_URL;
  this.key = process.env.APP_KEEPER_KEY;
  this.secret = process.env.APP_KEEPER_SECRET;
  if (!this.key || !this.secret || !this.url) {
    logger.error('Unable to create Keeper archive provider. Configuration not set.');
    return null;
  }
  return this;
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
    return when.reject('Keeper provider registred.');
  }
  var provider = user.providers.keeper,
      url = this.url;
  return nodefn.call(Article.get, aid).then(function(article) {
    return nodefn.call(request.post, {
      url: url + '/api/document',
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
 * Remove article from Keeper.
 * @param {Object} user User
 * @param {String} aid Article ID to remove
 * @return {Promise} the promise of saving
 */
KeeperProvider.prototype.removeArticle = function(user, aid) {
  logger.info('Removing article %s for user %s from Keeper...', aid, user.uid);
  return when.resolve(article);
};


/**
 * Get provider infos.
 * @return {Object} the provider infos
 */
KeeperProvider.prototype.info = function() {
  return {
    name: this.name,
    description: this.description,
    url: this.url,
    key: this.key
  };
};


module.exports = KeeperProvider;

