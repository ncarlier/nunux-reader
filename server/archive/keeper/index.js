var logger = require('../../helpers/logger');


module.exports = function() {
  var url = process.env.APP_KEEPER_URL,
      key = process.env.APP_KEEPER_KEY,
      secret = process.env.APP_KEEPER_SECRET;

  if (!key || !secret || !url) {
    logger.error('Unable to get Keeper archive provider. Configuration not set.');
    return null;
  }
  return {
    info: function() {
      return {
        name: 'keeper',
        description: 'Nunux Keeper',
        url: url,
        key: key
      };
    },
    save: function(user, article, next) {
      logger.error('Saving article %s for user %s to Keeper...', article.id, user.uid);
      return next(null);
    }
  }
};
