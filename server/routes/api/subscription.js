var api        = require('../../api'),
    middleware = require('../../middlewares');

/**
 * Subscription API routes.
 */
module.exports = function(app) {
  var contextHandler = middleware.contextHandler(app);

  /**
   * @apiDefineSuccessStructure Feed
   * @apiSuccess {String} id Feed ID.
   * @apiSuccess {String} title Feed title.
   * @apiSuccess {String} description Feed description.
   * @apiSuccess {String} htmlurl Feed website URL.
   * @apiSuccess {String} xmlurl Feed RSS URL.
   * @apiSuccess {String} pshbStatus PSHB status.
   * @apiSuccess {String} hub PSHB hub location.
   * @apiSuccess {String} status Last fetch status.
   * @apiSuccess {String} updateDate Last fetch date.
   */

  /**
   * @api {get} /api/subscription Request user's subscriptions
   * @apiVersion 0.9.0
   * @apiName GetSubscriptions
   * @apiGroup subscription
   * @apiPermission user
   *
   * @apiSuccessStructure Feed
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     [{
   *        htmlurl: "http://highscalability.com/blog/"
   *        hub: "http://pubsubhubbub.appspot.com/"
   *        id: "feed:5431c54e8b201a3eef816f76b112e167"
   *        lastModified: "Mon, 30 Jun 2014 16:19:10 GMT"
   *        pshbStatus: "subscribe"
   *        status: "updated"
   *        title: "High Scalability"
   *        updateDate: "2014-09-30T16:23:47.753Z"
   *        xmlurl: "http://feeds.feedburner.com/HighScalability"
   *     },
   *     {...},
   *     ...
   *     ]
   */
  app.get('/api/subscription', api.subscription.get);

  /**
   * @api {get} /api/subscription/export Request all user's subscriptions as an OPM file
   * @apiVersion 0.9.0
   * @apiName GetSubscriptionAsOPML
   * @apiGroup subscription
   * @apiPermission user
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     Content-Type: application/octet-stream
   *     attachment: subscribtions.xml
   */
  app.get('/api/subscription/export', contextHandler, api.subscription.download);

  /**
   * @api {post} /api/subscription Add user's subscription(s)
   * @apiVersion 0.9.0
   * @apiName AddSubscription
   * @apiGroup subscription
   * @apiPermission user
   *
   * @apiParamTitle (Create) Parameters only for single creation:
   * @apiParam (Create) {String} url Feed RSS URL.
   *
   * @apiParamTitle (Upload) Parameters only for single creation:
   * @apiParam (Upload) {File} file OPML file.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 201 OK
   */
  app.post('/api/subscription', api.subscription.create);

  /**
   * @api {delete} /api/subscription/:id Remove user's subscription
   * @apiVersion 0.9.0
   * @apiName RemoveSubscription
   * @apiGroup subscription
   * @apiPermission user
   *
   * @apiParam {String} id Feed ID.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 204 OK
   */
  app.delete('/api/subscription/:id', api.subscription.remove);
};
