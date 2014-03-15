/**
 * Routes.
 */
module.exports = function(app) {
  return {
    api: require('./api')(app),
    frontend: require('./frontend')(app)
  };
};
