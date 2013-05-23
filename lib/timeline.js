var db = require('./db'),
    Article = require('./article'),
    async = require('async'),
    crypto = require('crypto');

var Timeline = module.exports = function() {};

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
        var limit = parseInt(rank, 10) + parseInt(size);
        // Get list of article ids...
        if (reverse) db.zrevrange(key, rank, limit, callback);
        else db.zrange(key, rank, limit, callback);
      },
      function(replies, callback) {
        // Get articles contents...
        async.map(replies, Article.get, callback);
      },
      function(articles) {
        // Build result
        var next = (articles.length == parseInt(size) + 1) ? articles.pop() : null;
        var result = {
          next: next ? next.id : undefined,
          articles: articles
        };
        done(null, result);
      }
    ],
    function(err) {
      console.log('Error will Timeline.get: %s', err);
      done(err);
    }
  );
}

/**
 * Get timeline size.
 * @param {String}   key  Timeline key.
 * @param {Function} done Callback with timeline size in params.
 */
Timeline.getSize = function(key, done) {
  db.zcard(key, function(err, reply) {
    if (err) return done(err);
    done(null, {total: reply});
  });
}

/**
 * Remove article from the timeline.
 * @param {String}   key     Timeline key.
 * @param {Object}   article Article.
 * @param {Function} done    Callback with result in params.
 */
Timeline.removeArticle = function(key, article, done) {
  db.zrem(key, article.id, done);
}

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
}

/**
 * Remove all articles from a timeline.
 * @param {String}   key     Timeline key.
 * @param {Function} done    Callback with result in params.
 */
Timeline.removeAllArticles = function(key, done) {
  // TODO maybe better perf with a simple del command...
  db.zremrangebyscore(key, '-inf', '+inf', done);
}

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
        }
        async.map(replies, removeArticle, done);
      }
    ],
    function(err) {
      console.log('Error will Timeline.removeIntersectArticles: %s', err);
      done(err);
    }
  );
}

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
}

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
        var deleteArticle = function(aid, next) {
          console.log('Deleting article %s ...', aid);
          db.del(aid, next);
        }
        async.map(replies, deleteArticle, callback);
      },
      function() {
        db.zremrangebyscore(key, '-inf', score.toString(), done);
      }
    ],
    function(err) {
      console.log('Error will Timeline.deleteArticlesAfter: %s', err);
      done(err);
    }
  );
}

