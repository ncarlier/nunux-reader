/**
 * Middleware to ensure that PubSubHubBud is enabled.
 */
module.exports = function(app){
  return function(req, res, next) {
    if (app.get('pshb')) { return next(); }
    res.status(403).send('PubSubHubBud disabled.');
  };
};
