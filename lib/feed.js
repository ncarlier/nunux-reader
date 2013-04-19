var db = require('./db')
  , crypto = require('crypto')
  , async = require('async');

var Feed = module.exports = function() {};

Feed.getKey = function(url) {
  var hash = crypto.createHash('md5').update(url).digest("hex");
  return 'feed:' + hash;
}

Feed.getSubscribersKey = function(fid) {
  return fid + ':subscribers';
}

Feed.findOrCreate = function(feed, done) {
  var fid = Feed.getKey(feed.xmlurl);
  async.waterfall(
    [
      function(callback) {
        db.exists(fid, callback); 
      },
      function(exists, callback) {
        if (exists) {
          Feed.find(fid, done);
        } else {
          Feed.create(feed, done);
        }
      }
    ],
    function(err) {
      console.log('Error will Feed.findOrCreate: %s', err);
      done(err);
    }
  );
}

Feed.find = function(fid, done) {
  db.hgetall(fid, done);
}

Feed.create = function(feed, done) {
  var fid = Feed.getKey(feed.xmlurl);
  console.log('Create feed %s ...', feed.xmlurl);

  var newFeed = {
    title: feed.title,
    text: feed.text,
    xmlurl: feed.xmlurl,
    htmlurl: feed.htmlurl,
    type: feed.type
  }

  db.hmset(fid, newFeed, function(err, reply) {
    if (err) return done(err);
    console.log('Feed %s created: %s', fid, reply);
    done(null, newFeed);
  });
}

