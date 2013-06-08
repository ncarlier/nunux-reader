var db = require('./db')
  , crypto = require('crypto')
  , FeedParser = require('feedparser')
  , request = require('request')
  , async = require('async');

var Feed = module.exports = function() {};

var isValidUrl = function(url) {
  return /((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url);
}

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
 * Test if a feed exists.
 * @param {Object}   fid  Feed ID.
 * @param {Function} done Callback with exists status in params.
 */
Feed.exists = function(fid, done) {
  db.exists(fid, done);
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
        Feed.exists(fid, callback);
      },
      function(exists) {
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
 * Get all feeds (feed ids).
 * @param {Function} done Callback with fids in params.
 * */
Feed.getAll = function(done) {
  db.lrange('feeds', '0', '-1', done);
}

/**
 * Get feed infos from url.
 * @param {String}   url  Feed URL.
 * @param {Function} done Callback with feed in params.
 */
Feed.getFeedInfos = function(url, done) {
  var req = {
    uri: url,
    proxy: process.env.HTTP_PROXY
  };
  try {
    var r = request(req);
    r.pipe(
      new FeedParser()
      .on('error', done)
      .on('meta', function (meta) {
        done(null, {
          title: meta.title,
          xmlurl: meta.xmlurl || url,
          htmlurl: meta.link
        })
      })
    );
    r.on('error', done);
  } catch (e) {
    done(e.message);
  }
}

/**
 * Create a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
Feed.create = function(feed, done) {
  var fid = Feed.getKey(feed.xmlurl);
  console.log('Create feed %s ...', feed.xmlurl);

  async.waterfall(
    [
      function(callback) {
        // if just an url then get feed infos...
        if (!feed.title) {
          Feed.getFeedInfos(feed.xmlurl, callback);
        } else {
          callback(null, {
            title: feed.title,
            xmlurl: feed.xmlurl,
            htmlurl: feed.htmlurl
          });
        }
      },
      function(newFeed, callback) {
        db.hmset(fid, newFeed, callback); 
      },
      function(reply, callback) {
        console.log('Feed %s created: %s', fid, reply);
        db.rpush('feeds', fid, callback);
      },
      function(reply) {
        Feed.get(fid, done);
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
  var now = new Date();
  data.updateDate = now.toISOString();
  if (data.status.match(/^error/)) {
    if (feed.errCount && !isNaN(feed.errCount)) {
      errCount = parseInt(feed.errCount, 10) + 1;
    } else {
      errCount = 1;
    }
    data.errCount = errCount.toString();
  } else {
    data.errCount = '0';
  }
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

