#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    OpmlParser = require('opmlparser'),
    fs = require('fs'),
    redis = require('redis'),
    client = redis.createClient(),
    crypto = require('crypto'),
    async = require('async');

program
  .version('0.0.1')
  .option('-u, --user [user]', 'User subscription OPML file', 'user')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

var userKey = 'user:' + program.user;
var file = program.args[0];

console.log('Import OPML file: %s for %s ...', file, userKey);

function processFeed(feed, next) { 
  console.log('Got feed: %s', JSON.stringify(feed));
  // feed: title / text / xmlUrl / htmlUrl / description / type / language / version
  async.waterfall(
    [
      function(callback) {
        // Create feed key
        var hash = crypto.createHash('md5').update(feed.xmlurl).digest("hex");
        var key = 'feed:' + hash;
        // Add feed to user subscriptions
        client.sadd(userKey + ':subscriptions', key, function(err) {
          callback(err, key);
        });
      },
      function(key, callback) {
        // Add user to feed subscribers
        client.sadd(key + ':subscribers', userKey, function(err) {
          callback(err, key);
        });
      },
      function(key, callback) {
        // Create feed if not already exists...
        client.exists(key, function(err, exists) {
          if (exists) return callback('ALREADY_EXISTS');
          callback(null, key);
        });
      },
      function(key, callback) {
        // Store feed...
        // HMSET feed:1000 title "" xmlUrl "" ...
        client.hmset(key,
                     'title', feed.title,
                     'text', feed.text,
                     'xmlurl', feed.xmlurl,
                     'htmlurl', feed.htmlurl,
                     'type', feed.type,
                     function(err, reply) {
          callback(err, key);
        });
      },
      function(key, callback) {
        // Add feed to feed list...
        // RPUSH feeds feed:1000
        client.rpush('feeds', key, callback);
      },
      function(reply) {
        console.log('Feed registered: %s', reply);
        next(null);
      }
    ],
    next
  );
}

client.on('error', function (err) {
  console.log('Error: ' + err);
});

client.on('connect', function() {
  // Check user
  client.exists(userKey, function(err, exists) {
    if (!exists) {
      client.quit();
      console.log('Error: USER NOT FOUND');
    } else {
      // Parse file...
      fs.createReadStream(file).pipe(new OpmlParser())
      .on('error', function (err) {
        client.quit();
        console.log('Error: ' + err);
      })
      .on('meta', function (meta) {
        console.log('This OPML is entitled: "%s"', meta.title);
      })
      .on('complete', function (meta, feeds, outline) {
        async.each(feeds, processFeed, function(err) { 
          if (err) return console.log('ERROR: ' + err);
          console.log('Import OPML file: %s for %s done.', file, userKey);
          client.quit();
        });
      });
    }
  });
});


