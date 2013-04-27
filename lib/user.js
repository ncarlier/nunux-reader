var db = require('./db')
  , Feed = require('./feed')
  , Article = require('./article')
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
 * Get user's timeline storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getTimelineKey = function(uid) {
  return 'user:' + uid + ':timeline';
}

/**
 * Get user's archives storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getArchivesKey = function(uid) {
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
  var getFeed = function(key, callback) {
    db.hgetall(key, callback);
  }

  db.smembers(User.getSubscriptionsKey(uid), function(err, replies) {
    if (err) return done(err);
    async.map(replies, getFeed, done);
  });
}

/**
 * Subscribe a user to a feed.
 * @param {String}   uid  User ID.
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback.
 */
User.subscribe = function(uid, fid, done) {
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
          User.subscribe(uid, Feed.getKey(feed.xmlurl), next);
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
 * Get user's timeline size.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.getTimelineSize = function(uid, done) {
  db.zcount(User.getTimelineKey(uid), '-inf', '+inf', function(err, reply) {
    if (err) return done(err);
    done(null, {total: reply});
  });
}

/**
 * Get user's timeline (articles).
 * @param {String}   uid    User ID.
 * @param {Integer}  offset Offset of the range in the timeline.
 * @param {Integer}  size   Size of the range.
 * @param {Function} done   Callback with user's timeline (article) in params.
 */
User.getTimeline = function(uid, offset, size, done) {
  async.waterfall(
    [
      function(callback) {
        // Get list of article ids...
        db.zrangebyscore(User.getTimelineKey(uid), '-inf', '+inf', 'LIMIT', offset, size, callback);
      },
      function(replies) {
        // Get artcles contents...
        async.map(replies, Article.get, done);
      }
    ],
    function(err) {
      console.log('Error will User.getTimeline: %s', err);
      done(err);
    }
  );
}

/**
 * Read an article. Aka remove article from the user's timeline.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.read = function(uid, aid, done) {
  async.waterfall(
    [
      function(callback) {
        // Remove article from user timeline
        db.zrem(User.getTimelineKey(uid), aid, callback);
      },
      function(reply, callback) {
        // Return timeline size
        User.getTimelineSize(uid, done);
      }
    ],
    function(err) {
      console.log('Error will User.read: %s', err);
      done(err);
    }
  );
}

/**
 * Un read an article. Aka restore article into the user's timeline.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's timeline size in params.
 */
User.unRead = function(uid, aid, done) {
  async.waterfall(
    [
      function(callback) {
        // Get article
        Article.get(aid, callback);
      },
      function(article, callback) {
        // Compute score
        var date = new Date(article.pubdate);
        var score = date.getTime() * 1e-3;
        // Add article to timeline
        db.zadd(User.getTimelineKey(uid), score.toString(), article.id, callback);
      },
      function(reply) {
        // Return timeline size
        User.getTimelineSize(uid, done);
      }
    ],
    function(err) {
      console.log('Error will User.read: %s', err);
      done(err);
    }
  );
}

/**
 * Get user's archives size.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with user's archives size in params.
 */
User.getArchivesSize = function(uid, done) {
  db.zcount(User.getArchivesKey(uid), '-inf', '+inf', function(err, reply) {
    if (err) return done(err);
    done(null, {total: reply});
  });
}

/**
 * Get user's archives (saved articles).
 * @param {String}   uid    User ID.
 * @param {Integer}  offset Offset of the range in archives.
 * @param {Integer}  size   Size of the range.
 * @param {Function} done   Callback with user's archives (article) in params.
 */
User.getArchives = function(uid, offset, size, done) {
  async.waterfall(
    [
      function(callback) {
        // Get list of article ids...
        db.zrangebyscore(User.getArchivesKey(uid), '-inf', '+inf', 'LIMIT', offset, size, callback);
      },
      function(replies) {
        // Get artcles contents...
        async.map(replies, Article.get, done);
      }
    ],
    function(err) {
      console.log('Error will User.getArchives: %s', err);
      done(err);
    }
  );
}

/**
 * Archibe an article. Aka store article into the user's archives.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's archives size in params.
 */
User.archive = function(uid, aid, done) {
  async.waterfall(
    [
      function(callback) {
        // Get article
        Article.get(aid, callback);
      },
      function(article, callback) {
        // Compute score
        var date = new Date(article.pubdate);
        var score = date.getTime() * 1e-3;
        // Add article to archives
        db.zadd(User.getArchivesKey(uid), score.toString(), article.id, callback);
      },
      function(reply) {
        // Return timeline size
        User.getArchivesSize(uid, done);
      }
    ],
    function(err) {
      console.log('Error will User.archive: %s', err);
      done(err);
    }
  );
}

/**
 * Un archibe an article. Aka remove article from the user's archives.
 * @param {String}   uid  User ID.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with user's archives size in params.
 */
User.unArchive = function(uid, aid, done) {
  async.waterfall(
    [
      function(callback) {
        // Remove article from user archives
        db.zrem(User.getArchivesKey(uid), aid, callback);
      },
      function(reply, callback) {
        // Return archives size
        User.getArchivesSize(uid, done);
      }
    ],
    function(err) {
      console.log('Error will User.unArchive: %s', err);
      done(err);
    }
  );
}


