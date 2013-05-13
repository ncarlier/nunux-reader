var db = require('./db')
  , Feed = require('./feed')
  , Timeline = require('./timeline')
  , OpmlParser = require('opmlparser')
  , fs = require('fs')
  , async = require('async');

var User = module.exports = function() {};


/**
 * Get user storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getKey = function(uid) {
  return 'user:' + uid;
}

/**
 * Get user's global timeline storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getGlobalTimelineKey = function(uid) {
  return 'user:' + uid + ':timeline';
}

/**
 * Get user's archives storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getArchiveTimelineKey = function(uid) {
  return 'user:' + uid + ':archives';
}

/**
 * Get user's subscriptions storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getSubscriptionsKey = function(uid) {
  return 'user:' + uid + ':subscriptions';
}

/**
 * Test if user exists.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with exists status in params.
 */
User.exists = function(uid, done) {
  db.exists(User.getKey(uid), done); 
}

/**
 * Find or create a user.
 * @param {Object}   user User.
 * @param {Function} done Callback with user in params.
 */
User.findOrCreate = function(user, done) {
  var uid = user.uid;
  async.waterfall(
    [
      function(callback) {
        User.exists(uid, callback); 
      },
      function(exists, callback) {
        if (exists) {
          User.find(uid, done);
        } else {
          User.create(user, done);
        }
      }
    ],
    function(err) {
      console.log('Error will User.findOrCreate: %s', err);
      done(err);
    }
  );
}

/**
 * Find a user.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with user in params.
 */
User.find = function(uid, done) {
  db.hgetall(User.getKey(uid), done);
}

/**
 * Create a user.
 * @param {Object}   user User.
 * @param {Function} done Callback with user in params.
 */
User.create = function(user, done) {
  var uid = user.uid;
  console.log('Create user %s ...', uid);

  user.registrationDate = new Date().getTime().toString();

  db.hmset(User.getKey(uid), user, function(err, reply) {
    if (err) return done(err);
    console.log('User %s created: %s', uid, reply);
    done(null, user);
  });
}

/**
 * Get user's subscriptions (Feeds).
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with user's subscriptions (Feeds) in params.
 */
User.getSubscriptions = function(uid, done) {
  db.smembers(User.getSubscriptionsKey(uid), function(err, replies) {
    if (err) return done(err);
    async.map(replies, Feed.get, done);
  });
}

/**
 * Register subscribtion of a user to a feed.
 * @param {String}   uid  User ID.
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback.
 */
User._registerSubscribtion = function(uid, fid, done) {
  async.waterfall(
    [
      function(callback) {
        // Add feed to user subscriptions
        db.sadd(User.getSubscriptionsKey(uid), fid, callback);
      },
      function(reply, callback) {
        // Add user to feed subscribers
        db.sadd(Feed.getSubscribersKey(fid), User.getKey(uid), done);
      }
    ],
    function(err) {
      console.log('Error will User.registerSubscribtion: %s', err);
      done(err);
    }
  );
}

/**
 * Subscribe a user to a feed.
 * @param {String}   uid  User ID.
 * @param {String}   urm  Feed URL.
 * @param {Function} done Callback with feed in params.
 */
User.subscribe = function(uid, url, done) {
  var fid = Feed.getKey(url);
  async.waterfall(
    [
      function(callback) {
        User.exists(uid, callback);
      },
      function(exists, callback) {
        if (!exists) return callback('Error: USER NOT FOUND');
        // Find or create feed
        Feed.findOrCreate({xmlurl: url});
      },
      function(feed) {
        // Add feed to user subscriptions
        User._registerSubscribtion(uid, fid, function(err, reply) {
          done(err, feed);
        });
      }
    ],
    function(err) {
      console.log('Error will User.subscribe: %s', err);
      done(err);
    }
  );
}

/**
 * Import OPML file for a user.
 * Create feeds if not exists and subscribe the user to each feed.
 * @param {String}   uid  User ID.
 * @param {Object}   file Feed ID.
 * @param {Function} done Callback.
 */
User.import = function(uid, file, done) {
  // Process feed callback.
  function processFeed(feed, next) { 
    async.waterfall(
      [
        function(callback) {
          // Create feed if not already exists...
          Feed.findOrCreate(feed, callback);
        },
        function(feed) {
          // Add feed to user subscriptions
          User._registerSubscribtion(uid, Feed.getKey(feed.xmlurl), next);
        }
      ],
      next
    );
  }

  User.exists(uid, function(err, exists) {
    if (err || !exists) {
      done(err || 'Error: USER NOT FOUND');
    }
    // Parse file...
    fs.createReadStream(file).pipe(new OpmlParser())
    .on('error', done)
    .on('complete', function (meta, feeds, outline) {
      async.each(feeds, processFeed,  done);
    });
  });
}

/**
 * Get user's global timeline size.
 * @param {String}   uid     User ID.
 * @param {Function} done    Callback with user's timeline size in params.
 */
User.getGlobalTimelineSize = function(uid, done) {
  var key = User.getGlobalTimelineKey(uid);
  Timeline.getSize(key, done);
}

/**
 * Get user's archive timeline size.
 * @param {String}   uid     User ID.
 * @param {Function} done    Callback with user's timeline size in params.
 */
User.getArchiveTimelineSize = function(uid, done) {
  var key = User.getArchiveTimelineKey(uid);
  Timeline.getSize(key, done);
}

/**
 * Get user's global timeline (articles).
 * @param {String}   uid     User ID.
 * @param {Integer}  start   Start element of the range.
 * @param {Integer}  size    Size of the range (default: 10).
 * @param {String}   order   Order: 'ASC' or 'DESC'.
 * @param {Function} done    Callback with user's timeline (article) in params.
 */
User.getGlobalTimeline = function(uid, start, size, order, done) {
  var key = User.getGlobalTimelineKey(uid);
  Timeline.get(key, start, size, order, done);
}

/**
 * Get user's global timeline (articles).
 * @param {String}   uid     User ID.
 * @param {Integer}  start   Start element of the range.
 * @param {Integer}  size    Size of the range (default: 10).
 * @param {String}   order   Order: 'ASC' or 'DESC'.
 * @param {Function} done    Callback with user's timeline (article) in params.
 */
User.getArchiveTimeline = function(uid, start, size, order, done) {
  var key = User.getArchiveTimelineKey(uid);
  Timeline.get(key, start, size, order, done);
}

/**
 * Remove article from the user's global timeline.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.removeFromGlobalTimeline = function(uid, aid, done) {
  var key = User.getGlobalTimelineKey(uid);
  Timeline.removeArticle(key, aid, done);
}

/**
 * Remove article from the user's archive timeline.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.removeFromArchiveTimeline = function(uid, aid, done) {
  var key = User.getArchiveTimelineKey(uid);
  Timeline.removeArticle(key, aid, done);
}

/**
 * Restore article into the user's global timeline.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.restoreToGlobalTimeline = function(uid, aid, done) {
  var key = User.getGlobalTimelineKey(uid);
  Timeline.addArticle(key, aid, done);
}

/**
 * Store article into the user's archive timeline.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.storeToArchiveTimeline = function(uid, aid, done) {
  var key = User.getArchiveTimelineKey(uid);
  Timeline.addArticle(key, aid, done);
}


