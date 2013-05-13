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
        // Get artcles contents...
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
 * @param {String}   key  Timeline key.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with timeline size in params.
 */
Timeline.removeArticle = function(key, aid, done) {
  async.waterfall(
    [
      function(callback) {
        // Remove article from timeline
        db.zrem(key, aid, callback);
      },
      function(reply, callback) {
        // Return timeline size
        Timeline.getSize(key, done);
      }
    ],
    function(err) {
      console.log('Error will Timeline.removeArticle: %s', err);
      done(err);
    }
  );
}

/**
 * Add article to the timeline.
 * @param {String}   uid  Timeline key.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with timeline size in params.
 */
Timeline.addArticle = function(key, aid, done) {
  async.waterfall(
    [
      function(callback) {
        // Get article
        Article.get(aid, callback);
      },
      function(article, callback) {
        // Compute score
        var date = new Date(article.pubdate);
        var score = date.getTime() * 1e-3;
        // Add article to timeline
        db.zadd(key, score.toString(), article.id, callback);
      },
      function(reply) {
        // Return timeline size
        Timeline.getSize(key, done);
      }
    ],
    function(err) {
      console.log('Error will Timeline.addArticle: %s', err);
      done(err);
    }
  );
}

