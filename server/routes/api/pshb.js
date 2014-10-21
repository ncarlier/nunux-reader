var api = require('../../api');

/**
 * PubSubHubbud API routes.
 */
module.exports = function(app) {
  app.get('/pubsubhubbud/callback', api.pubsubhubbud.callback);
  app.post('/pubsubhubbud/callback', api.pubsubhubbud.post);
};
