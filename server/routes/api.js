var api        = require('../api');
    middleware = require('../middlewares');

/**
 * API Routes.
 */
module.exports = function(app) {
  var contextHandler = middleware.contextHandler(app);
  // API info:
  app.get('/api', contextHandler, api.info);
  // User API:
  app.get('/api/user', api.user.get);
  // Subscription API:
  app.get('/api/subscription', api.subscription.get);
  app.get('/api/subscription/export', contextHandler, api.subscription.download);
  app.post('/api/subscription', api.subscription.create);
  app.delete('/api/subscription/:id', api.subscription.remove);
  // Timeline API:
  app.get('/api/timeline', api.timeline.all);
  app.get('/api/timeline/:timeline', api.timeline.get);
  app.get('/api/timeline/:timeline/status', api.timeline.status);
  app.delete('/api/timeline/:timeline/:aid', api.timeline.removeArticle);
  app.delete('/api/timeline/:timeline', api.timeline.removeAllArticles);
  app.put('/api/timeline/:timeline/:aid', api.timeline.addArticle);
  // Archive API:
  app.get('/api/archive', api.archive.all);
  app.post('/api/archive/:provider/:aid', api.archive.assertProvider, api.archive.saveArticle);
  app.get('/api/archive/:provider/registration/request', contextHandler, api.archive.assertProvider, api.archive.registrationRequest);
  app.get('/api/archive/:provider/registration/callback', contextHandler, api.archive.assertProvider, api.archive.registrationCallback);
  // Admin API:
  app.get('/api/admin/stats', api.admin.stats);
  app.get('/api/admin/user/:email', api.admin.getUser);
  app.post('/api/admin/user/:email', api.admin.createUser);
  app.delete('/api/admin/user/:email', api.admin.deleteUser);
  // PubSubHubbud API:
  app.get('/pubsubhubbud/callback', api.pubsubhubbud.callback);
  app.post('/pubsubhubbud/callback', api.pubsubhubbud.post);
};
