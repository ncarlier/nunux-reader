var db = require('./db'),
    async = require('async'),
    crypto = require('crypto');

var Article = module.exports = function() {};

/**
 * Get an article.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with article in params.
 */
Article.get = function(aid, done) {
  db.get(aid, function(err, article) {
    if (err || article == null) return done(err || 'Article ' + aid + ' not found.');
    article = JSON.parse(article);
    article.id = aid;
    done(null, article);
  });
}

/**
 * Create an article.
 * @param {Object}   article Article.
 * @param {Object}   feed    Feed.
 * @param {Function} done    Callback with article in params.
 */
Article.create = function(article, feed, done) {
  async.waterfall(
    [
      function(callback) {
        var hash = crypto.createHash('md5').update(article.guid).digest("hex");
        article.id = feed.id + ':' + hash;
        db.exists(article.id, callback);
      },
      function(exists, callback) {
        if (exists) return callback('ALREADY_EXISTS');
        // Save article...
        db.set(article.id, JSON.stringify(article), callback);
      },
      function(reply, callback) {
        // Add article to feed...
        db.lpush(feed.id + ':articles', article.id, callback);
      },
      function(reply, callback) {
        db.rpush('articles:integration', article.id, callback);
      },
      function(reply) {
        done(null, article);
      }
    ],
    function(err) {
      done(err);
    }
  );
}

