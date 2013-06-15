#!/usr/bin/env node

var program = require('commander'),
    db = require('../lib/db'),
    Article = require('../lib/article'),
    Feed = require('../lib/feed'),
    User = require('../lib/user'),
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

console.log('Starting Timeline Updater...');

var signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
for (var i in signals) {
  process.on(signals[i], function() {
    console.log('Stopping Timeline Updater...');
    stop = true;
  });
}

db.on('connect', function() {
  app.emit('nextarticle');
});

app.on('stop', function() {
  db.quit(function (err, res) {
    console.log(err || 'Stopping Timeline Updater: done.');
    process.exit();
  });
});

app.on('nextarticle', function() {
  if (stop) {
    return app.emit('stop');
  }
  async.waterfall(
    [
      function(callback) {
        // Get article key to integrate...
        db.blpop('articles:integration', 5, callback);
      },
      function(replies, callback) {
        if (replies == null) {
          return app.emit('nextarticle');
        }
        // Get article from db...
        var aid = replies[1];
        Article.get(aid, callback);
      },
      function(article, callback) {
        console.log('Integrating article %s (%s)...', article.id, article.pubdate);
        var updateUserTimelines = function(uid, next) {
          User.addArticleToTimeline(uid, 'global', article, next);
        }
        // Get feed subscribers...
        var parts = article.id.split(':');
        var fid = parts[0] + ':' + parts[1];
        Feed.getSubscribers(fid, function(err, uids) {
          if (err) return callback(err);
          async.each(uids, updateUserTimelines, callback);
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

