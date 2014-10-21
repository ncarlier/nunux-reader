var api        = require('../../api'),
    middleware = require('../../middlewares');

/**
 * API Routes.
 */
module.exports = function(app) {
  var contextHandler = middleware.contextHandler(app);
  // API info:
  app.get('/api', contextHandler, api.info);
  // Admin API
  require('./admin')(app);
  // Archive API
  require('./archive')(app);
  // Subscription API
  require('./subscription')(app);
  // Timeline API
  require('./timeline')(app);
  // User API
  require('./user')(app);
  // PubSubHubbud API
  require('./pshb')(app);
};
