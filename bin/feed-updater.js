#!/usr/bin/env node

/**
 * Module dependencies.
 */
require('date-utils');
var program = require('commander'),
    FeedParser = require('feedparser'),
    fs = require('fs'),
    request = require('request'),
    redis = require('redis'),
    async = require('async'),
    crypto = require('crypto'),
    EventEmitter = require('events').EventEmitter;

var app = new EventEmitter();
var client = redis.createClient();

program
  .version('0.0.1')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

console.log('Feed Updater starting...');

client.on('error', function (err) {
  console.log('Error ' + err);
});
client.on('connect', function() {
  app.emit('nextfeed');
});

app.on('nextfeed', function() {
  async.waterfall(
    [
      function(callback) {
        // RPOPLPUSH feeds feeds
        client.rpoplpush('feeds', 'feeds', callback);
      },
      function(feedKey, callback) {
        // HGETALL feed:1000
        client.hgetall(feedKey, function(err, feed) {
          if (err) return callback(err);
          feed.key = feedKey;
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
        });
      },
      function(feed, callback) {
        // update date...
        client.hmset(feed.key,
                     'lastUpdate', new Date().getTime(),
                     function(err, reply) {
                       callback(err, feed);
                     });
      },
      function(feed, callback) {
        // read feed...
        console.log('Got feed: %j', feed);
        var req = {
          /*'proxy': 'http://proxy-internet.localnet:3128',*/
          'uri': feed.xmlurl/*,
          'headers': {
            'If-Modified-Since' : lastModified,
            'If-None-Match' : etag
          }*/
        };
        request(req)
          .pipe(new FeedParser())
          .on('error', callback)
          .on('meta', function (meta) {
            console.log('Feed info: %s - %s - %s', meta.title, meta.link, meta.xmlurl);
          })
          .on('article', function (article) {
            // console.log('Article: %s - %s (%s)', article.date, article.title, article.link);
            saveArticle(feed, article);
          })
          .on('end', callback);
      },
      function() {
        console.log('Feed parsed.');
        app.emit('nextfeed');
      }
    ],
    function(err) {
      console.log('Error: %s', err);
      app.emit('nextfeed');
    }
  );
});

function saveArticle(feed, article) {
  async.waterfall(
    [
      function(callback) {
        var guid = crypto.createHash('md5').update(article.guid).digest("hex");
        var key = feed.key + ':' + guid;
        client.exists(key, function(err, exists) {
          if (exists) return callback('ALREADY_EXISTS');
          callback(null, key);
        });
      },
      function(key, callback) {
        // Save article...
        client.set(key, JSON.stringify(article), function(err, reply) {
          callback(err, key);
        });
        // todo? EXPIRE entry:1000 60*60*24*30
      },
      function(key, callback) {
        // Add article to feed...
        // LPUSH feed:1000:entries entry:1000
        client.lpush(feed.key + ':articles', key, function(err, reply) {
          callback(err, key);
        });
        // todo? LTRIM feed:1000:entries 0 999
      },
      function(key, callback) {
        client.rpush('articles:integration', key, callback);
      },
      function() {
        console.log('Article "%s" added to feed %s.', article.title, feed.key);
      }
    ],
    function(err) {
      console.log('Error: %s', err);
    }
  );
}
