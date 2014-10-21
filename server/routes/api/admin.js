var api = require('../../api');

/**
 * Admin API routes.
 */
module.exports = function(app) {
  app.get('/api/admin/stats', api.admin.stats);
  app.get('/api/admin/user/:email', api.admin.getUser);
  app.post('/api/admin/user/:email', api.admin.createUser);
  app.delete('/api/admin/user/:email', api.admin.deleteUser);
};
