require('date-utils');
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
 * Also add the new article to the feed timeline and to the
 * integration queue.
 * @param {Object}   article Article.
 * @param {Object}   feed    Feed.
 * @param {Function} done    Callback with article in params.
 */
Article.create = function(article, feed, done) {
  var daysToKeep = process.env.APP_DAYS_TO_KEEP || 30;
  async.waterfall(
    [
      function(callback) {
        // check date validity
        if (!article.pubdate) return callback('Article pub date undefined.');
        var date = new Date(article.pubdate);
        date.addDays(daysToKeep);
        if (date.isBefore(new Date())) {
          callback('Article too old: ' + article.pubdate);
        }
        else {
          callback();
        }
      },
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
        // Add article to feed timeline...
        // Compute score
        var date = new Date(article.pubdate);
        var score = date.getTime() * 1e-3;
        // Add article to timeline
        db.zadd(feed.id + ':articles', score.toString(), article.id, callback);
      },
      function(reply, callback) {
        // Add article to integration queue...
        db.rpush('articles:integration', article.id, callback);
      },
      function(reply) {
        done(null, article);
      }
    ],
    function(err) {
      // if (err !== 'ALREADY_EXISTS') console.error('Error will Article.create: %s', err);
      done(err);
    }
  );
}

/**
 * Create an article copy.
 * @param {Object}   article Article.
 * @param {String}   aid     New Article ID.
 * @param {Function} done    Callback with article in params.
 */
Article.copy = function(article, aid, done) {
  async.waterfall(
    [
      function(callback) {
        db.exists(aid, callback);
      },
      function(exists, callback) {
        if (exists) return Article.get(aid, done);
        else {
          // Copy article
          article.id = aid;
          db.set(article.id, JSON.stringify(article), callback);
        }
      },
      function(reply, callback) {
        console.log('Article %s copied.', article.id);
        done(null, article);
      }
    ],
    function(err) {
      console.error('Error will Article.copy: %s', err);
      done(err);
    }
  );
}

