#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    OpmlParser = require('opmlparser'),
    parser = new OpmlParser(),
    fs = require('fs'),
    redis = require('redis'),
    client = redis.createClient(),
    async = require('async');

program
  .version('0.0.1')
  .option('-f, --file [file]', 'OPML file', 'file')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

console.log('Import %s ...', program.file);

parser.on('meta', function (meta){
  console.log('This OPML is entitled: "%s"', meta.title);
});

parser.on('feed', function(feed){
  console.log('Got feed: %s', JSON.stringify(feed));
  // feed: title / text / xmlUrl / htmlUrl / description / type / language / version
  async.waterfall(
    [
      function(callback) {
        // INCR global:nextFeedId
        client.incr('global:nextFeedId', callback);
      },
      function(reply, callback) {
        // HMSET feed:1000 title "" xmlUrl "" ...
        var key = 'feed:' + reply;
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
        // RPUSH feeds feed:1000
        client.rpush('feeds', key, callback);
      },
      function(reply) {
        console.log('Feed registered: %s', reply);
      }
    ],
    function(err) {
      console.log('Error: %s', err);
    }
  );
});

parser.on('end', function (){
  console.log('End.');
  //client.quit();
});

client.on('error', function (err) {
  console.log('Error ' + err);
});

client.on('connect', function() {
  // Parse file...
  parser.parseFile(program.file);
});


