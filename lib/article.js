require('date-utils');
var db = require('./db'),
    logger = require('./logger'),
    async = require('async'),
    crypto = require('crypto');

var Article = module.exports = function() {};

var attrWhiteList = [
  'author', 'date', 'description', 'enclosures', 'fid', 'guid', 'id', 'image', 'link',
  'origlink', 'pubdate', 'pubDate', 'summary', 'title'];

/**
 * Get true Article key.
 * @param {String} key generic key
 * @return {String}    Returns article key or null if not found
 */
Article.assertKey = function(key) {
  if (!key) return null;
  var aid = key.match(/(feed:\w+:\w+)/gm);
  return aid ? aid[0] : null;
};


/**
 * Get an article.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with article in params.
 */
Article.get = function(aid, done) {
  db.get(aid, function(err, article) {
    if (err || article === null) return done(err || 'Article ' + aid + ' not found.');
    article = JSON.parse(article);
    article.id = aid;
    var fid = aid.match(/(feed:\w+)/gm);
    article.fid = fid ? fid[0] : null;
    done(null, article);
  });
};

/**
 * Create an article.
 * Also add the new article to the feed timeline and to the
 * integration queue.
 * @param {Object}   article Article.
 * @param {Object}   feed    Feed.
 * @param {Function} done    Callback with article in params.
 */
Article.create = function(article, feed, done) {
  var daysToKeep = parseInt(process.env.APP_DAYS_TO_KEEP || 30, 10);
  async.waterfall(
    [
      function(callback) {
        // check date validity
        if (!article.pubdate) return callback('Article pub date is undefined.');
        if (isNaN(Date.parse(article.pubdate))) return callback('Article pud date is unreadable: ' + article.pubdate);
        var date = new Date(article.pubdate);
        date.addDays(daysToKeep);
        if (date.isBefore(new Date())) {
          callback('ETOOOLD');
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
        if (exists) return callback('EEXIST');
        // Remove unwanted attributes...
        var obj = {};
        for (var i = 0 ; i < attrWhiteList.length ; i++) {
          var attr = attrWhiteList[i];
          obj[attr] = article[attr];
        }
        // Save article...
        db.set(article.id, JSON.stringify(obj), callback);
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
      done(err);
    }
  );
};

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
        logger.info('Article %s copied.', article.id);
        done(null, article);
      }
    ],
    function(err) {
      logger.error('Error will Article.copy: %s', err);
      done(err);
    }
  );
};

/**
 * Delete an article.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with no params.
 */
Article.del = function(aid, done) {
  db.del(aid, function(err) {
    if (err) return done(err);
    logger.debug('Article % deleted.', aid);
    done();
  });
};

