var api        = require('../../api'),
    middleware = require('../../middlewares');

/**
 * Archiving provider API routes.
 */
module.exports = function(app) {
  var contextHandler = middleware.contextHandler(app);

  /**
   * @api {get} /api/archive Get all archiving providers
   * @apiVersion 0.9.0
   * @apiName GetAllArchivingProvider
   * @apiGroup archive
   * @apiPermission user
   *
   * @apiSuccess {String} description Archiving provider description.
   * @apiSuccess {String} name        Archiving provider name.
   * @apiSuccess {String} url         Archiving provider url.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     [{
   *        description: "Nunux Keeper
   *        name: "keeper"
   *        url: "http://keeper.nunux.org"
   *     },
   *     {...}
   *     ]
   */
  app.get('/api/archive', api.archive.all);

  /**
   * @api {post} /api/archive/:provider/:aid Send article to the archiving provider.
   * @apiVersion 0.9.0
   * @apiName SendArticleToArchivingProvider
   * @apiGroup archive
   * @apiPermission user
   *
   * @apiParam {String} provider Archiving provider's name.
   * @apiParam {String} aid      Article ID.
   *
   * @apiSuccess {String} ref      Article extrenal reference.
   * @apiSuccess {String} provider Archiving provider name.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        provider: "keeper"
   *        ref: "a54c156d46a5e1f87a"
   *     }
   */
  app.post('/api/archive/:provider/:aid', api.archive.assertProvider, api.archive.saveArticle);

  /**
   * @api {get} /api/archive/:provider/registration/request Request to be register by the archiving provider.
   * @apiVersion 0.9.0
   * @apiName RegisterToArchivingProvider
   * @apiGroup archive
   * @apiPermission user
   *
   * @apiParam {String} provider Archiving provider's name.
   */
  app.get('/api/archive/:provider/registration/request', contextHandler, api.archive.assertProvider, api.archive.registrationRequest);
  app.get('/api/archive/:provider/registration/callback', contextHandler, api.archive.assertProvider, api.archive.registrationCallback);
};
