#!/usr/bin/env node

'use strict';

var STANDALONE = module.parent ? false : true;

if (STANDALONE) {
  process.title = 'reader-feed-updater';
}

var _            = require('underscore'),
    appInfo      = require('../../package.json'),
    program      = require('commander'),
    EventEmitter = require('events').EventEmitter,
    async        = require('async'),
    request      = require('request'),
    db           = require('../helpers').redis,
    logger       = require('../helpers').logger,
    Feed         = require('../models/feed');

if (process.env.HTTP_PROXY) {
  request = request.defaults({proxy: process.env.HTTP_PROXY, timeout: 5000});
} else {
  request = request.defaults({timeout: 5000});
}

// Constants
var MAX_AGE = 300,    // 5 minutes
    MAX_EXPIRATION_HOURS = 2; // 2 hours

/**
 * Test if date is parsable.
 * @param Date date date to parse
 * @return Boolean result of the test
 */
function isParsableDate(date) {
  var timestamp = Date.parse(date);
  return isNaN(timestamp) === false;
}

/**
 * Extract expiration date form the headers.
 * @param Object headers HTTP headers
 * @return Date expiration date
 */
function extractExpiresFromHeader(headers) {
  var expires = headers.expires;

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
    var maxAge = MAX_AGE;
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
  then.addHours(MAX_EXPIRATION_HOURS);
  if (!expires.between(new Date(), then)) {
      logger.debug('Warning: Expiration date out of bound (use default): %s', expires.toISOString());
      expires = new Date();
      expires.addSeconds(MAX_AGE);
  }
  return expires.toISOString();
}

/**
 * Feed updater daemon.
 */
function FeedUpdaterDaemon() {
  this.stopped = false;
  this.sleeping = null;
  this.samples = {};
  this.listener = new EventEmitter();
  this.listener.on('next', function() {
    this.sleeping = null;
    this.updateFeed(function(err) {
      if (this.stopped) {
        return;
      }
      if (err) {
        switch (err) {
          case 'NOT_EXPIRED':
            this.listener.emit('next');
            break;
          case 'SLEEP':
            logger.info('Make feed updater daemon sleeping for 60s ...');
            this.sleeping = setTimeout(function() {
              this.listener.emit('next');
            }.bind(this), 60000);
            break;
          default:
            logger.error('Feed updater daemon: Error during iterate over feeds.', err);
            this.listener.emit('next');
        }
      } else {
        this.listener.emit('next');
      }
    }.bind(this));
  }.bind(this));
}

/**
 * Test if the job is too crazy.
 * @param {String} fid Feed ID
 * @return Boolean result of the test.
 */
FeedUpdaterDaemon.prototype.jobIsTooCrazy = function(fid) {
  var isCrazy = false;
  if (this.samples[fid]) {
    var d = this.samples[fid];
    isCrazy = Math.abs(d.getSecondsBetween(new Date())) < MAX_AGE;
  }
  this.samples[fid] = new Date();
  return isCrazy;
};


/**
 * Update feeds.
 * @param {Function} next Next callback
 */
FeedUpdaterDaemon.prototype.updateFeed = function(next) {
  var feed = null,
      self = this;
  async.waterfall(
    [
      function(callback) {
        // Get last feed (and put in back into begining)
        db.rpoplpush('feeds', 'feeds', callback);
      },
      function(fid, callback) {
        if (fid === null || self.jobIsTooCrazy(fid)) {
          return callback('SLEEP');
        }
        // Get feed from db...
        Feed.get(fid, callback);
      },
      function(_feed, callback) {
        feed = _feed;
        if (!feed.expires) {
          // No expiration date... ok update!
          callback();
        } else {
          // Check expiration date...
          var err = null;
          if (isParsableDate(feed.expires)) {
            var now = new Date();
            var expirationDate = new Date(feed.expires);
            if (now.isBefore(expirationDate)) {
              logger.debug('Feed %s: Validity not expired (%s). Next.', feed.id, expirationDate.toISOString());
              err = 'NOT_EXPIRED';
            }
          } else {
            logger.debug('Warning: Feed %s: Expires date unparsable: %s.', feed.id, feed.expires);
          }
          callback(err);
        }
      },
      function(callback) {
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
          var expires = new Date();
          if (err) {
            // Error on HTTP request
            logger.warn('Feed %s: Error on request. Request postponed in 2 hours. Skiping.', feed.id);
            // Postpone expiration date in 2 hours
            expires.addHours(2);
            Feed.update(feed, {
              status: 'error: ' + err,
              expires: expires.toISOString()
            }, function(e) {
              callback(e || err);
            });
          } else if (res.statusCode === 200) {
            // Update feed status and cache infos.
            // logger.debug('200: Headers: %j', res.headers);
            logger.debug('Feed %s: Updating...', feed.id);
            Feed.update(feed, {
              status: 'updating',
              lastModified: res.headers['last-modified'],
              expires: extractExpiresFromHeader(res.headers),
              etag: res.headers.etag
            }, function(e, f) {
              callback(e, f, body);
            });
          } else if (res.statusCode === 304) {
            // Update feed status and cache infos.
            // logger.debug('304: Headers: %j', res.headers);
            logger.debug('Feed %s: Not modified. Skiping.', feed.id);
            Feed.update(feed, {
              status: 'not modified',
              expires: extractExpiresFromHeader(res.headers),
              etag: res.headers.etag
            }, function(e, f) {
              callback(e, f, null);
            });
          } else {
            logger.warn('Feed %s: Bad HTTP response. Request postponed in 24 hours. Skiping.', feed.id);
            // Postpone expiration date in 24 hours
            expires.addHours(24);
            Feed.update(feed, {
              status: 'error: Bad status code: ' + res.statusCode,
              expires: expires.toISOString()
            }, function(e) {
              if (e) {
                return callback(e);
              }
              callback('statusCode: ' + res.statusCode);
            });
          }
        });
      },
      function(_feed, content, callback) {
        feed = _feed;
        // Skip if not changed (no content)
        if (!content) {
          return callback();
        }
        Feed.updateArticles(content, feed, callback);
      },
      function() {
        next();
      }
    ],
    next
  );
};


/**
 * Start daemon.
 */
FeedUpdaterDaemon.prototype.start = function() {
  logger.info('Starting feed updater daemon...');
  if (STANDALONE) {
    db.on('connect', function() {
      this.listener.emit('next');
    }.bind(this));
  } else {
    this.listener.emit('next');
  }
};

/**
 * Stop daemon.
 * @param {Integer} returnCode code to return
 */
FeedUpdaterDaemon.prototype.stop = function(returnCode) {
  logger.info('Stopping feed updater daemon...');
  if (this.sleeping) {
    clearTimeout(this.sleeping);
  }
  if (STANDALONE) {
    db.quit(function (err) {
      logger.error(err || 'Stopping feed updater daemon: done.');
      process.exit(err ? 1 : returnCode);
    });
  } else {
    this.stopped = true;
    logger.error('Stopping feed updater daemon: done.');
  }
};

if (STANDALONE) {
  // Create standalone daemon. Aka self executable.
  program.version(appInfo.version)
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

  logger.level(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

  var app = new FeedUpdaterDaemon();
  // Start the daemon
  app.start();

  // Graceful shutdown.
  _.each(['SIGINT', 'SIGTERM', 'SIGQUIT'], function(signal) {
    process.on(signal, function() {
      app.stop((signal === 'SIGINT') ? 1 : 0);
    });
  });
}
else {
  // Export daemon instance
  module.exports = new FeedUpdaterDaemon();
}


