var api = require('../../api');

/**
 * user API routes.
 */
module.exports = function(app) {
  /**
   * @api {get} /api/user Request current user information
   * @apiVersion 0.9.0
   * @apiName GetUser
   * @apiGroup user
   * @apiPermission user
   *
   * @apiSuccess {String}   uid              ID of the User (email).
   * @apiSuccess {String}   username         Name of the User.
   * @apiSuccess {Date}     registrationDate Date of the registration.
   * @apiSuccess {Object[]} providers        List of activated archive providers.
   * @apiSuccess {Object}   providers.keeper Archive provider.
   * @apiSuccess {Boolean}  providers.keeper.access Archive provider status.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "uid": "jhon.doe@foo.bar",
   *       "username": "Jhon Doe",
   *       "registrationDate": "1373964740026",
   *       "providers":{"keeper":{"access":true}}
   *     }
   */
  app.get('/api/user', api.user.get);
};
