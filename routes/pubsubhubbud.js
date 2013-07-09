var db = require('../lib/db')
  , Feed = require('../lib/feed')
  , logger = require('../lib/logger')
  , async = require('async');

module.exports = function(app){
  app.ensurePubSubHubBud = function(req, res, next) {
    if (app.get('pshb')) { return next(); }
    res.status(403).send('PubSubHubBud disabled.');
  }

  /**
   * Update PubSubHubBud feed status.
   */
  app.get('/pubsubhubbud/callback', app.ensurePubSubHubBud,function(req, res, next) {
    var mode = req.query['hub.mode'];
    var topic = req.query['hub.topic'];
    var challenge = req.query['hub.challenge'];
    var lease = req.query['hub.lease_seconds'];
    var verifyToken = req.query['hub.verify_token'];

    if ('subscribe' == mode) {
      logger.info('PubSubHubBud confirmation callback received for %s', topic);
      var fid = Feed.getKey(topic);
      async.waterfall(
        [
          function(callback) {
            Feed.get(fid, callback);
          },
          function(feed, callback) {
            Feed.update(feed, {pshbEnabled: true}, callback);
          },
          function() {
            res.send(challenge);
          }
        ],
        function(err) {
          logger.error('Error will updating PubSubHubBud status: %s', err);
          next(err);
        }
      );
    } else {
      logger.info('Bad PubSubHubBud callback received %j', req.query);
      res.send(400);
    }
  });

  /**
   * Update PubSubHubBud feed status.
   */
  app.post('/pubsubhubbub/callback', app.ensurePubSubHubBud, function(req, res, next) {
    var fetchedFeed = req.body;
    Feed.parse(req.body, null, function(err, articles) {
      if (err) return next(err);
      res.send(200);
    });
  });
};
