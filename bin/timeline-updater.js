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

console.log('Timeline Updater starting...');

client.on('error', function (err) {
  console.log('Error ' + err);
});
client.on('connect', function() {
  app.emit('nextarticle');
});

app.on('nextarticle', function() {
  async.waterfall(
    [
      function(callback) {
        // Get article key to integrate...
        // BRPOP articles:integration 0
        client.blpop('articles:integration', 0, callback);
      },
      function(replies, callback) {
        // Get article from db
        // GET article:x
        var articleKey = replies[1];
        client.get(articleKey, function(err, reply) {
          if (err) return callback(err);
          var article = JSON.parse(reply);
          article.key = articleKey;
          callback(null, article);
        });
      },
      function(article, callback) {
        console.log('Integrating article %s (%s)...', article.key, article.pubdate);
        var updateUserPlaylist = function(item, clbk) {
          var userKey = item;
          var date = new Date(article.pubdate);
          var score = date.getTime() * 1e-3;
          client.zadd(userKey + ':playlist', score.toString(), article.key, clbk);
        }
        // Get feed subscribers...
        // SMEMBERS feed:1000:subscribers
        var parts = article.key.split(':');
        var feedSubscribersKey = parts[0] + ':' + parts[1] + ':subscribers';
        client.smembers(feedSubscribersKey, function(err, replies) {
          if (err) return callback(err);
          async.each(replies, updateUserPlaylist, callback);
        });
      },
      function() {
        app.emit('nextarticle');
      }
    ],
    function(err) {
      console.log('Error: %s', err);
      app.emit('nextarticle');
    }
  );
});

