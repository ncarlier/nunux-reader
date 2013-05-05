#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('date-utils');
var program = require('commander'),
    db = require('../lib/db'),
    Feed = require('../lib/feed'),
    Article = require('../lib/article'),
    FeedParser = require('feedparser'),
    request = require('request'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter;

var app = new EventEmitter();

var TIMER = 10;

program
  .version('0.0.1')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

console.log('Feed Updater starting...');

db.on('connect', function() {
  app.emit('nextfeed');
});

var defaultMaxAge = 300; // 5 minutes

var isParsableDate = function(date) {
  var timestamp = Date.parse(date);
  return isNaN(timestamp)==false;
}

var extractExpiresFromHeader = function(headers) {
  if (headers['expires']) return headers['expires'];
  var lastModified = headers['last-modified'];
  if (isParsableDate(lastModified)) {
    lastModified = new Date(lastModified);
  } else {
    console.log('Warning: Last-Modified date unparsable (use default): %s.', lastModified);
    console.log('Warning: HEADER: %j', headers);
    lastModified = new Date();
  }
  var cacheControl = headers['cache-control'];
  if (!cacheControl) {
    // return default expiration date
    console.log('Warning: No cache-control directive (use default).');
    lastModified.addSeconds(defaultMaxAge);
    return lastModified.toString();
  }
  var rx = /^.*max-age=(\d+).*$/;
  var vals = rx.exec(cacheControl);
  if (!vals) {
    // return default expiration date
    console.log('Warning: No max-age in cache-control directive (use default).');
    lastModified.addSeconds(defaultMaxAge);
    return lastModified.toString();
  }
  var maxAge = parseInt(vals[1], 10);
  lastModified.addSeconds(maxAge);
  return lastModified.toString();
}

app.on('nextfeed', function() {
  async.waterfall(
    [
      function(callback) {
        // Get last feed (and put in back into begining)
        db.rpoplpush('feeds', 'feeds', callback);
      },
      function(fid, callback) {
        if (fid == null) return callback('NO_FEED');
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
            if (now.isAfter(expirationDate)) {
              err = 'Feed ' + feed.id +
                ': Validity not expired (' + expirationDate.toString() +
                '). No need to update. Next.';
            }
          } else {
            console.log('Warning: Feed %s: Expires date unparsable: %s.', feed.id, feed.expires);
          }
          callback(err, feed);
        }
      },
      function(feed, callback) {
        // Do HTTP request...
        console.log('Feed %s: Requesting %s ...', feed.id, feed.xmlurl);
        var req = {
          'uri': feed.xmlurl,
          'headers': {}/*,
          'followRedirect': false*/
        };
        if (process.env.HTTP_PROXY) {
          req.proxy = process.env.HTTP_PROXY;
        }
        if (feed.lastModified) {
         req.headers['If-Modified-Since'] = feed.lastModified;
        }
        if (feed.etag) {
         req.headers['If-None-Match'] = feed.etag;
        }

        request(req, function(err, res, body) {
          if (err) return callback(err);
          if (res.statusCode == 200) {
            // Update feed status and cache infos.
            // console.log('200: Headers: %j', res.headers);
            console.log('Feed %s: Updating...', feed.id);
            Feed.update(feed, {
              lastModified: res.headers['last-modified'],
              expires: extractExpiresFromHeader(res.headers),
              etag: res.headers['etag']
            }, function(e, f) {
              callback(e, f, body);
            });
          } else if (res.statusCode == 304) {
            // Update feed status and cache infos.
            // console.log('304: Headers: %j', res.headers);
            console.log('Feed %s: Not modified. Skiping.', feed.id);
            Feed.update(feed, {
              expires: extractExpiresFromHeader(res.headers),
              etag: res.headers['etag']
            }, function(e, f) {
              callback(e, f, null);
            });
          } else {
            callback('statusCode: ' + res.statusCode);
          }
        });
      },
      function(feed, body, callback) {
        // Skip if not changed (no body)
        if (!body) return callback();

        FeedParser.parseString(body, function (err, meta, articles) {
          if (err) return callback(err);
          console.log('Feed %s: %s - %s', feed.id, meta.title, meta.link);
          for (var i in articles) {
            var article = articles[i];
            Article.create(article, feed, function(err, a) {
              if (err) {
                if (err != 'ALREADY_EXISTS') console.log('Feed %s: Unable to create article: %s', feed.id, err);
              }
              else console.log('Feed %s: New article %s : %s', feed.id, a.id, a.title);
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
        console.log('No feed to parse. Waiting for 120s ...');
        setTimeout(function(){
          app.emit('nextfeed');
        }, 120000);
      } else {
        console.log(err);
        app.emit('nextfeed');
      }
    }
  );
});

