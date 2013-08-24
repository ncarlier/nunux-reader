var db = require('./db'),
    logger = require('./logger'),
    Feed = require('./feed'),
    Article = require('./article'),
    async = require('async'),
    crypto = require('crypto');

var Timeline = module.exports = function() {};

/**
 * Get timeline status (title, feed, size).
 * @param {String}   key   Timeline key.
 * @param {Function} done  Callback with timeline status in params.
 */
Timeline.getStatus = function(key, done) {
  var result = {};
  async.waterfall(
    [
      function(callback) {
        var fid = Feed.assertKey(key);
        if (fid) Feed.get(fid, callback);
        else callback(null, null);
      },
      function(feed, callback) {
        if (feed) {
          result.timeline = feed.id;
          result.title = feed.title;
          result.feed = feed;
        } else {
          result.timeline = key.match(/:(\w+)$/)[1];
          if (result.timeline == 'global') result.title = 'All items';
          else if (result.timeline == 'archive') result.title = 'Saved items';
          else result.title = result.timeline;
        }
        Timeline.getSize(key, callback);
      },
      function(size) {
        result.size = size;
        done(null, result);
      }
    ],
    function(err) {
      logger.error('Error will Timeline.getStatus: %s', err);
      done(err);
    }
  );
};

/**
 * Get timeline (articles).
 * @param {String}   key   Timeline key.
 * @param {Integer}  start Start element of the range.
 * @param {Integer}  size  Size of the range (default: 10).
 * @param {String}   order Order: 'ASC' or 'DESC' (default: 'ASC').
 * @param {Function} done  Callback with timeline (article) in params.
 */
Timeline.get = function(key, start, size, order, done) {
  var reverse = order === 'DESC';
  var result = {};
  size |= '10';

  async.waterfall(
    [
      function(callback) {
        // Get rank of the first element (if setted)
        if (start) {
          if (reverse) db.zrevrank(key, start, callback);
          else db.zrank(key, start, callback);
        } else {
          callback(null, null);
        }
      },
      function(rank, callback) {
        // Set rank to 0 by default
        rank |= '0';
        var limit = parseInt(rank, 10) + parseInt(size, 10);
        // Get list of article ids...
        if (reverse) db.zrevrange(key, rank, limit, callback);
        else db.zrange(key, rank, limit, callback);
      },
      function(replies, callback) {
        // Get articles contents...
        var getArticle = function(aid, next) {
          Article.get(aid, function(err, article) {
            if (err) next(null, {
              id: aid,
              date: new Date(),
              pubdate: new Date(),
              title: 'ARTICLE NOT AVAILABLE!',
              description: '<p>Error on getting article content: ' + err + '</p>'
            });
            else next(null, article);
          });
        };
        async.map(replies, getArticle, callback);
      },
      function(articles) {
        // Build result
        var next = (articles.length == parseInt(size, 10) + 1) ? articles.pop() : null;
        result.next = next ? next.id : undefined;
        result.articles = articles;
        result.order = order;
        done(null, result);
      }
    ],
    function(err) {
      logger.error('Error will Timeline.get: %s', err);
      done(err);
    }
  );
};

/**
 * Get timeline size.
 * @param {String}   key  Timeline key.
 * @param {Function} done Callback with timeline size in params.
 */
Timeline.getSize = function(key, done) {
  db.zcard(key, done);
};

/**
 * Remove article from the timeline.
 * @param {String}   key     Timeline key.
 * @param {Object}   article Article.
 * @param {Function} done    Callback with result in params.
 */
Timeline.removeArticle = function(key, article, done) {
  db.zrem(key, article.id, done);
};

/**
 * Add article to the timeline.
 * @param {String}   key     Timeline key.
 * @param {Object}   article Article.
 * @param {Function} done    Callback with result in params.
 */
Timeline.addArticle = function(key, article, done) {
  // Compute score
  var date = new Date(article.pubdate);
  var score = date.getTime() * 1e-3;
  // Add article to timeline
  db.zadd(key, score.toString(), article.id, done);
};

/**
 * Add all articles from a timeline to another.
 * @param {String}   srcKey  Source Timeline key.
 * @param {String}   destKey Destination Timeline key.
 * @param {Function} done    Callback with result in params.
 */
Timeline.addAllArticles = function(srcKey, destKey, done) {
  async.waterfall(
    [
      function(callback) {
        db.zrange(srcKey, 0, -1, 'WITHSCORES', callback); 
      },
      function(replies, callback) {
        var aids = [];
        for (var i = 0 ; i < replies.length ; i+=2) {
          aids.push({key: replies[i], score: replies[i+1]});
        }
        var addArticle = function(obj, next) {
          db.zadd(destKey, obj.score, obj.key, next);
        };
        async.map(aids, addArticle, done);
      }
    ],
    function(err) {
      logger.error('Error will Timeline.addAllArticles: %s', err);
      done(err);
    }
  );
};


/**
 * Remove all articles from a timeline (simply delete the timeline).
 * @param {String}   key     Timeline key.
 * @param {Function} done    Callback with result in params.
 */
Timeline.removeAllArticles = function(key, done) {
  //db.zremrangebyscore(key, '-inf', '+inf', done);
  db.del(key, done);
};

/**
 * Remove articles intersect from a timeline with another.
 * @param {String}   key     Timeline key.
 * @param {String}   withKey Timeline intersect with key.
 * @param {Function} done    Callback with result in params.
 */
Timeline.removeIntersectArticles = function(key, withKey, done) {
  async.waterfall(
    [
      function(callback) {
        db.zrange(withKey, 0, -1, callback); 
      },
      function(replies, callback) {
        var removeArticle = function(aid, next) {
          db.zrem(key, aid, next);
        };
        async.map(replies, removeArticle, done);
      }
    ],
    function(err) {
      logger.error('Error will Timeline.removeIntersectArticles: %s', err);
      done(err);
    }
  );
};

/**
 * Remove old entries from a timeline.
 * @param {String}   key   Timeline key.
 * @param {Date}     after Date.
 * @param {Function} done  Callback with nb of deleted entry in params.
 */
Timeline.removeArticlesAfter = function(key, after, done) {
  // Compute score
  var score = after.getTime() * 1e-3;
  // Add article to timeline
  db.zremrangebyscore(key, '-inf', score.toString(), done);
};

/**
 * Delete old articles from a timeline.
 * Warning: Article is deleted!
 * @param {String}   key   Timeline key.
 * @param {Date}     after Date.
 * @param {Function} done  Callback with result in params.
 */
Timeline.deleteArticlesAfter = function(key, after, done) {
  var score = after.getTime() * 1e-3;
  async.waterfall(
    [
      function(callback) {
        db.zrangebyscore(key, '-inf', score.toString(), callback);
      },
      function(replies, callback) {
        async.map(replies, Article.del, callback);
      },
      function() {
        db.zremrangebyscore(key, '-inf', score.toString(), done);
      }
    ],
    function(err) {
      logger.error('Error will Timeline.deleteArticlesAfter: %s', err);
      done(err);
    }
  );
};

