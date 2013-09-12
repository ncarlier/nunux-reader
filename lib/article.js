require('date-utils');
var db = require('./db'),
    logger = require('./logger'),
    async = require('async'),
    crypto = require('crypto');

var Article = module.exports = function() {};

var attrWhiteList = [
  'author', 'date', 'description', 'enclosures', 'fid', 'guid', 'id', 'image', 'link',
  'origlink', 'pubdate', 'pubDate', 'summary', 'title', 'meta'];

var attrMandatoryList = [
  'date', 'description', 'id', 'link', 'pubdate', 'title', 'meta'];

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
    if (err || article === null) return done(err || 'ENOTFOUND');
    article = JSON.parse(article);
    article.id = aid;
    if (!article.fid) {
      var fid = aid.match(/(feed:\w+)/gm);
      article.fid = fid ? fid[0] : null;
    }
    done(null, article);
  });
};

/**
 * Save an article.
 * @param {Object}   article Article.
 * @param {Function} done    Callback with article in params.
 */
Article.save = function(article, done) {
  async.waterfall(
    [
      function(callback) {
        // Save article
        db.exists(article.id, callback);
      },
      function(exists, callback) {
        if (exists) return callback('EEXIST');
        // Remove unwanted attributes...
        var attr, i;
        var obj = {};
        for (i = 0 ; i < attrWhiteList.length ; i++) {
          attr = attrWhiteList[i];
          obj[attr] = article[attr];
        }
        // Check mandatory attributes...
        for (i = 0 ; i < attrMandatoryList.length ; i++) {
          attr = attrMandatoryList[i];
          if (!obj[attr]) {
            logger.warn('Unable to create article %s. Attribute %s is missing.',
                      article.id, attr);
            return done('EATTRIBUTE');
          }
        }
        // Clean content (replace src image attribute)
        obj.description = obj.description.replace(/<img([^>]+)src\s*=/gi, '<img$1data-src=');
        db.set(article.id, JSON.stringify(obj), callback);
      },
      function(reply) {
        logger.debug('Article %s (%s) saved.', article.id, article.link);
        Article.get(article.id, done);
      }
    ],
    done
  );
};

/**
 * Create an article.
 * Also check date validity and add the new article to the feed 
 * timeline and to the integration queue.
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
        var guid = article.guid;
        if (!guid) {
          logger.debug('Feed %s : Article GUID not found. Using link instead: %s',
                      feed.id, article.origlink || article.link);
          guid = article.origlink || article.link;
        }
        var hash = crypto.createHash('md5').update(guid).digest("hex");
        article.id = feed.id + ':' + hash;
        Article.save(article, callback);
      },
      function(reply, callback) {
        article = reply;
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
    done
  );
};

/**
 * Create an article copy.
 * @param {String}   src Source artice ID.
 * @param {String}   dest     Destination article ID.
 * @param {Function} done    Callback with article in params.
 */
Article.copy = function(src, dest, done) {
  async.waterfall(
    [
      function(callback) {
        Article.get(src, callback);
      },
      function(article, callback) {
        if (src === dest) {
          logger.debug('Source equals destination. Article %s will not be copied.', src);
          done(null, article);
        } else {
          // do the copy
          db.set(dest, JSON.stringify(article), callback);
        }
      },
      function(reply, callback) {
        logger.info('Article %s copied.', dest);
        Article.get(dest, done);
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

