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
          expirationDate.addMinutes(5);
          if (now.isAfter(expirationDate)) {
            callback(null, feed);
          } else {
            var timeout = now.getSecondsBetween(expirationDate);
            console.log('Waiting for %d s...', timeout);
            setTimeout(function(){
              callback(null, feed);
            }, Math.abs(timeout) * 1000);
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
        request(req)
          .pipe(new FeedParser())
          .on('error', callback)
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
          .on('end', callback);
      },
      function() {
        app.emit('nextfeed');
      }
    ],
    function(err) {
      console.log('Error: %s', err);
      app.emit('nextfeed');
    }
  );
});

