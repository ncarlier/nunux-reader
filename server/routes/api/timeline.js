var api        = require('../../api'),
    middleware = require('../../middlewares');

/**
 * Timeline API routes.
 */
module.exports = function(app) {
  var contextHandler = middleware.contextHandler(app);

  /**
   * @apiDefineSuccessStructure TimelineStatus
   * @apiSuccess {Integer} size     Number of unread items in the timeline.
   * @apiSuccess {String}  timeline ID of the timeline.
   * @apiSuccess {String}  title    Timeline title.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        size: 0
   *        timeline: "feed:69ced2e5a0ca8ee9e107475207c1a9a2"
   *        title: "Foo Bar"
   *     }
   */

 
  /**
   * @api {get} /api/timeline Request all user's timelines statuses
   * @apiVersion 0.9.0
   * @apiName GetAllTimelineStatus
   * @apiGroup timeline
   * @apiPermission user
   *
   * @apiSuccessStructure TimelineStatus
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     [{
   *        size: 0
   *        timeline: "global"
   *        title: "All items"
   *     },
   *     {
   *        size: 0
   *        timeline: "feed:69ced2e5a0ca8ee9e107475207c1a9a2"
   *        title: "Foo Bar"
   *     },
   *     {...}
   *     ]
   */
  app.get('/api/timeline', api.timeline.all);

  /**
   * @api {get} /api/timeline/:timeline Request user's timeline content
   * @apiVersion 0.9.0
   * @apiName GetTimelineContent
   * @apiGroup timeline
   * @apiPermission user
   *
   * @apiParam {String}  timeline Timeline ID.
   * @apiParam {String}  [next]   ID of the next article in the timeline
   * @apiParam {String}  [order]  Sort order (ASC or DESC)
   * @apiParam {String}  [show]   Type of viewing ('new' for unread articles or 'all' for all articles)
   * @apiParam {Integer} [size]   Maximum number of article to retrieve (default: 10)
   *
   * @apiSuccess {Object[]} articles Articles
   * @apiSuccess {String}   articles.author      Article's author.
   * @apiSuccess {String}   articles.date        Creation date.
   * @apiSuccess {String}   articles.description Content.
   * @apiSuccess {String}   articles.fid         Feed's ID.
   * @apiSuccess {String}   articles.id          Article's ID.
   * @apiSuccess {String}   articles.link        URL.
   * @apiSuccess {Object}   articles.meta        Meta data.
   * @apiSuccess {String}   articles.pubdate     Publication date.
   * @apiSuccess {String}   articles.summary     Summary.
   * @apiSuccess {String}   articles.title       Title.
   * @apiSuccess {String}    order    Sort order (ASC ou DESC).
   * @apiSuccess {String}    next     Next article ID.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        articles: [
   *          {...}
   *        ],
   *        order: "ASC",
   *        next: "feed:96c6b11a3f19575626ef2058d8eda6fb:31ac7521c92253b6d1ae95a77c593c58"
   *     }
   */
  app.get('/api/timeline/:timeline', api.timeline.get);

  /**
   * @api {get} /api/timeline/:timeline/status Request user's timeline status
   * @apiVersion 0.9.0
   * @apiName GetTimelineStatus
   * @apiGroup timeline
   * @apiPermission user
   *
   * @apiParam {String} timeline Timeline ID.
   *
   * @apiSuccessStructure TimelineStatus
   *
   */
  app.get('/api/timeline/:timeline/status', api.timeline.status);

  /**
   * @api {delete} /api/timeline/:timeline/:aid Mark an article in the timeline as read
   * @apiVersion 0.9.0
   * @apiName MarkAsRead
   * @apiGroup timeline
   * @apiPermission user
   *
   * @apiParam {String} timeline Timeline ID.
   * @apiParam {String} aid      Article ID.
   *
   * @apiSuccessStructure TimelineStatus
   */
  app.delete('/api/timeline/:timeline/:aid', api.timeline.removeArticle);

  /**
   * @api {delete} /api/timeline/:timeline Mark all articles in the timeline as read
   * @apiVersion 0.9.0
   * @apiName MarkAllAsRead
   * @apiGroup timeline
   * @apiPermission user
   *
   * @apiParam {String} timeline Timeline ID.
   *
   * @apiSuccessStructure TimelineStatus
   */
  app.delete('/api/timeline/:timeline', api.timeline.removeAllArticles);

  /**
   * @api {put} /api/timeline/:timeline/:aid Mark an article in the timeline as unread
   * @apiVersion 0.9.0
   * @apiName MarkAsUnread
   * @apiGroup timeline
   * @apiPermission user
   *
   * @apiParam {String} timeline Timeline ID.
   * @apiParam {String} aid      Article ID.
   *
   * @apiSuccessStructure TimelineStatus
   */
  app.put('/api/timeline/:timeline/:aid', api.timeline.addArticle);
};
