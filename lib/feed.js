var db = require('./db')
  , crypto = require('crypto')
  , async = require('async');

var Feed = module.exports = function() {};


/**
 * Get feed storage key.
 * @param {String} url Feed URL.
 * @return {String}    Returns the key
 */
Feed.getKey = function(url) {
  var hash = crypto.createHash('md5').update(url).digest("hex");
  return 'feed:' + hash;
}

/**
 * Get feed's subscribers storage key.
 * @param {String} fid Feed ID.
 * @return {String}    Returns the key
 */
Feed.getSubscribersKey = function(fid) {
  return fid + ':subscribers';
}

/**
 * Find or create a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
Feed.findOrCreate = function(feed, done) {
  var fid = Feed.getKey(feed.xmlurl);
  async.waterfall(
    [
      function(callback) {
        db.exists(fid, callback); 
      },
      function(exists, callback) {
        if (exists) {
          Feed.get(fid, done);
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

/**
 * Get a feed.
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback with feed in params.
 */
Feed.get = function(fid, done) {
  db.hgetall(fid, function(err, feed) {
    if (err || feed == null) return done(err || 'Feed ' + fid + ' not found.');
    feed.id = fid;
    done(null, feed);
  });
}

/**
 * Create a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
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

  async.waterfall(
    [
      function(callback) {
        db.hmset(fid, newFeed, callback); 
      },
      function(reply, callback) {
        console.log('Feed %s created: %s', fid, reply);
        db.rpush('feeds', fid, callback);
      },
      function(reply, callback) {
        done(null, newFeed);
      }
    ],
    function(err) {
      console.log('Error will Feed.create: %s', err);
      done(err);
    }
  );
}

/**
 * Update a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
Feed.update = function(feed, data, done) {
  for (i in data) {
    if (data[i] === null || data[i] === undefined) {
      delete data[i];
    }
  }
  if (!Object.keys(data).length) return done(null, feed);
  //console.log('Update feed %s with %j ...', feed.id, data);
  db.hmset(feed.id, data, function(err, reply) {
    for (var x in data) feed[x] = data[x];
    done(err, feed);
  });
}

/**
 * Get feed's subscribers (Users).
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback with feed's subscribers (uids) in params.
 */
Feed.getSubscribers = function(fid, done) {
  db.smembers(Feed.getSubscribersKey(fid), done);
}

