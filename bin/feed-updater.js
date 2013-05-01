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

process.on('uncaughtException', function(err) {
  console.log(err);
});

db.on('connect', function() {
  app.emit('nextfeed');
});

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
        var now = new Date();
        if (!feed.lastUpdate) {
          // No update date... ok update!
          callback(null, feed);
        } else {
          // Check time since last update...
          var expirationDate = new Date(parseInt(feed.lastUpdate, 10));
          expirationDate.addMinutes(TIMER);
          if (now.isAfter(expirationDate)) {
            callback(null, feed);
          } else {
            var timeout = now.getSecondsBetween(expirationDate);
            if (timeout <= 10) {
              callback(null, feed);
            } else { 
              console.log('Waiting for %ds ...', timeout);
              setTimeout(function(){
                callback(null, feed);
              }, Math.abs(timeout) * 1000);
            }
          }
        }
      },
      function(feed, callback) {
        // update date...
        db.hmset(feed.id,
                 'lastUpdate', new Date().getTime(),
                 function(err, reply) {
                   callback(err, feed);
                 });
      },
      function(feed, callback) {
        // Request feed...
        console.log('Requesting feed: %s ...', feed.xmlurl);
        var req = {
          'uri': feed.xmlurl/*,
          // TODO deal with HTTP 304 response code
          'headers': {
            'If-Modified-Since' : lastModified,
            'If-None-Match' : etag
          }*/
        };
        if (process.env.HTTP_PROXY) {
          req.proxy = process.env.HTTP_PROXY;
        }

        FeedParser.parseStream(request(req))
        .on('meta', function (meta) {
          console.log('Feed info: %s - %s - %s', meta.title, meta.link, meta.xmlurl);
        })
        .on('article', function (article) {
          Article.create(article, feed, function(err, a) {
            if (err) {
              if (err != 'ALREADY_EXISTS') {
                console.log('Error while creating article: %s', err);
              }
            } else {
              console.log('Article %s created: %s', a.id, a.title);
            }
          });
        })
        .on('error', callback)
        .on('complete', function(meta, articles) {
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
        console.log('Error: %s', err);
        app.emit('nextfeed');
      }
    }
  );
});

