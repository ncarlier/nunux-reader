#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('date-utils');
var program = require('commander'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    Feed = require('../lib/feed'),
    Article = require('../lib/article'),
    FeedParser = require('feedparser'),
    request = require('request'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter;

var app = new EventEmitter();
var stop = false;

program
  .version('0.0.1')
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

logger.setLevel(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

logger.info('Starting Feed Updater...');

var signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
for (var i in signals) {
  process.on(signals[i], function() {
    logger.info('Stopping Feed Updater...');
    stop = true;
  });
}

db.on('connect', function() {
  app.emit('nextfeed');
});

app.on('stop', function() {
  db.quit(function (err, res) {
    logger.info(err || 'Stopping Feed Updater: done.');
    process.exit();
  });
});

if (process.env.HTTP_PROXY) {
  request = request.defaults({proxy: process.env.HTTP_PROXY, timeout: 5000});
} else {
  request = request.defaults({timeout: 5000});
}

var defaultMaxAge = 300    // 5 minutes
  , maxExpirationHours = 2 // 2 hours
  , samples = {};

var jobIsTooCrazy = function(fid) {
  var isCrazy = false;
  if (samples[fid]) {
    var d = samples[fid];
    isCrazy = Math.abs(d.getSecondsBetween(new Date())) < defaultMaxAge;
  }
  samples[fid] = new Date();
  return isCrazy;
}

var isParsableDate = function(date) {
  var timestamp = Date.parse(date);
  return isNaN(timestamp)==false;
}

var extractExpiresFromHeader = function(headers) {
  var expires = headers['expires'];

  if (expires && isParsableDate(expires)) {
    // Extract expires from header.
    expires = new Date(expires);
  } else {
    logger.debug('Warning: No expires directive (compute it): %s.', expires);
    // Compute expires from cache infos of the header...
    var lastModified = headers['last-modified'];
    if (isParsableDate(lastModified)) {
      lastModified = new Date(lastModified);
    } else {
      logger.debug('Warning: Last-Modified date unparsable (use default): %s.', lastModified);
      logger.debug('Warning: HEADER: %j', headers);
      lastModified = new Date();
    }
    var maxAge = defaultMaxAge;
    var cacheControl = headers['cache-control'];
    if (!cacheControl) {
      logger.debug('Warning: No cache-control directive (use default).');
    } else {
      // Extract max age from cache control directive...
      var rx = /^.*max-age=(\d+).*$/;
      var vals = rx.exec(cacheControl);
      if (!vals) {
        logger.debug('Warning: No max-age in cache-control directive (use default).');
      } else {
        maxAge = parseInt(vals[1], 10);
      }
    }
    expires = lastModified.addSeconds(maxAge);
  }
  // Check validity
  var then = new Date();
  then.addHours(maxExpirationHours);
  if (!expires.between(new Date(), then)) {
      logger.debug('Warning: Expiration date out of bound (use default): %s', expires.toISOString());
      expires = new Date();
      expires.addSeconds(defaultMaxAge);
  }
  return expires.toISOString();
}

app.on('nextfeed', function() {
  if (stop) {
    return app.emit('stop');
  }
  async.waterfall(
    [
      function(callback) {
        // Get last feed (and put in back into begining)
        db.rpoplpush('feeds', 'feeds', callback);
      },
      function(fid, callback) {
        if (fid == null) return callback('NO_FEED');
        if (jobIsTooCrazy(fid)) return callback('TOO_CRAZY');
        // Get feed from db...
        Feed.get(fid, callback);
      },
      function(feed, callback) {
        if (!feed.expires) {
          // No expiration date... ok update!
          callback(null, feed);
        } else {
          // Check expiration date...
          var err = null;
          if (isParsableDate(feed.expires)) {
            var now = new Date();
            var expirationDate = new Date(feed.expires);
            if (now.isBefore(expirationDate)) {
              err = 'Feed ' + feed.id +
                ': Validity not expired (' + expirationDate.toISOString() +
                '). No need to update. Next.';
            }
          } else {
            logger.debug('Warning: Feed %s: Expires date unparsable: %s.', feed.id, feed.expires);
          }
          callback(err, feed);
        }
      },
      function(feed, callback) {
        // Do HTTP request...
        logger.debug('Feed %s: Requesting %s ...', feed.id, feed.xmlurl);
        var req = {
          'uri': feed.xmlurl,
          'headers': {}/*,
          'followRedirect': false*/
        };
        if (feed.lastModified) {
         req.headers['If-Modified-Since'] = feed.lastModified;
        }
        if (feed.etag) {
         req.headers['If-None-Match'] = feed.etag;
        }

        request(req, function(err, res, body) {
          if (err) {
            logger.warn('Feed %s: Error on request. Request postponed in 2 hours. Skiping.', feed.id);
            // Postpone expiration date in 2 hours
            var expires = new Date();
            expires.addHours(2);
            Feed.update(feed, {
              status: 'error: ' + err,
              expires: expires.toISOString()
            }, function(e, f) {
              if (e) return callback(e);
              callback(err);
            });
            return callback(err);
          } else if (res.statusCode == 200) {
            // Update feed status and cache infos.
            // logger.debug('200: Headers: %j', res.headers);
            logger.debug('Feed %s: Updating...', feed.id);
            Feed.update(feed, {
              status: 'updated',
              lastModified: res.headers['last-modified'],
              expires: extractExpiresFromHeader(res.headers),
              etag: res.headers['etag']
            }, function(e, f) {
              callback(e, f, body);
            });
          } else if (res.statusCode == 304) {
            // Update feed status and cache infos.
            // logger.debug('304: Headers: %j', res.headers);
            logger.debug('Feed %s: Not modified. Skiping.', feed.id);
            Feed.update(feed, {
              status: 'not modified',
              expires: extractExpiresFromHeader(res.headers),
              etag: res.headers['etag']
            }, function(e, f) {
              callback(e, f, null);
            });
          } else {
            logger.warn('Feed %s: Bad HTTP response. Request postponed in 24 hours. Skiping.', feed.id);
            // Postpone expiration date in 24 hours
            var expires = new Date();
            expires.addHours(24);
            Feed.update(feed, {
              status: 'error: Bad status code: ' + res.statusCode,
              expires: expires.toISOString()
            }, function(e, f) {
              if (e) return callback(e);
              callback('statusCode: ' + res.statusCode);
            });
          }
        });
      },
      function(feed, body, callback) {
        // Skip if not changed (no body)
        if (!body) return callback();

        FeedParser.parseString(body, function (err, meta, articles) {
          if (err) return callback(err);
          logger.debug('Feed %s: %s - %s', feed.id, meta.title, meta.link);
          for (var i in articles) {
            var article = articles[i];
            Article.create(article, feed, function(err, a) {
              if (err) {
                if (err != 'EEXIST' && err != 'ETOOOLD') logger.warn('Feed %s: Unable to create article: %s', feed.id, err);
              }
              else logger.debug('Feed %s: New article %s : %s', feed.id, a.id, a.title);
            });
          }
          callback(null);
        });
      },
      function() {
        app.emit('nextfeed');
      }
    ],
    function(err) {
      if (err == 'NO_FEED') {
        logger.info('No feed to parse. Waiting for 120s ...');
        setTimeout(function(){
          app.emit('nextfeed');
        }, 120000);
      } else if (err == 'TOO_CRAZY') {
        logger.info('Ok. Job is running too fast. Slow down a bit. Waiting for %s s ...', defaultMaxAge);
        setTimeout(function(){
          app.emit('nextfeed');
        }, defaultMaxAge * 1000);
      } else {
        logger.error(err);
        app.emit('nextfeed');
      }
    }
  );
});

