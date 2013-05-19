var db = require('./db')
  , Feed = require('./feed')
  , Article = require('./article')
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
  if (uid.indexOf('user:') == 0) return uid;
  return 'user:' + uid;
}

/**
 * Get user's global timeline storage key.
 * @param {String} uid      User ID.
 * @param {String} timeline Timeline name.
 * @return {String} Returns the key
 */
User.getTimelineKey = function(uid, timeline) {
  return User.getKey(uid) + ':' + timeline;
}

/**
 * Get user's subscriptions storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getSubscriptionsKey = function(uid) {
  return User.getKey(uid) + ':subscriptions';
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
 * Get all users (uids).
 * @param {Function} done Callback with uids in params.
 */
User.getAll = function(done) {
  db.smembers('users', done);
}

/**
 * Create a user.
 * Also add user to users set.
 * @param {Object}   user User.
 * @param {Function} done Callback with user in params.
 */
User.create = function(user, done) {
  var uid = user.uid;
  console.log('Create user %s ...', uid);

  user.registrationDate = new Date().getTime().toString();

  async.waterfall(
    [
      function(callback) {
        db.hmset(User.getKey(uid), user, callback);
      },
      function(reply, callback) {
        console.log('User %s created: %s', uid, reply);
        // Add user to user set.
        db.sadd('users', User.getKey(uid), callback);
      },
      function() {
        done(null, user);
      }
    ],
    function(err) {
      console.log('Error will User.create: %s', err);
      done(err);
    }
  );
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
        // TODO add feed articles to timeline (or not...)
        // TODO (in a next episode) create user feed timeline
      }
    ],
    function(err) {
      console.log('Error will User._registerSubscribtion: %s', err);
      done(err);
    }
  );
}

/**
 * Un-register subscribtion of a user to a feed.
 * @param {String}   uid  User ID.
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback.
 */
User._unRegisterSubscribtion = function(uid, fid, done) {
  async.waterfall(
    [
      function(callback) {
        // Remove feed from user subscriptions
        db.srem(User.getSubscriptionsKey(uid), fid, callback);
      },
      function(reply, callback) {
        // Remove user from feed subscribers
        db.srem(Feed.getSubscribersKey(fid), User.getKey(uid), done);
        // TODO remove articles from timeline (or not...)
        // TODO (in a next episode) remove user feed timeline
      }
    ],
    function(err) {
      console.log('Error will User._unRegisterSubscribtion: %s', err);
      done(err);
    }
  );
}

/**
 * Subscribe a user to a feed.
 * @param {String}   uid  User ID.
 * @param {String}   url  Feed URL.
 * @param {Function} done Callback with feed in params.
 */
User.subscribe = function(uid, url, done) {
  async.waterfall(
    [
      function(callback) {
        User.exists(uid, callback);
      },
      function(exists, callback) {
        if (!exists) return callback('Error: USER NOT FOUND');
        // Find or create feed
        Feed.findOrCreate({xmlurl: url}, callback);
      },
      function(feed) {
        // Add feed to user subscriptions
        User._registerSubscribtion(uid, feed.id, function(err, reply) {
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
 * Un-subscribe a user to a feed.
 * @param {String}   uid  User ID.
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback with no params.
 */
User.unSubscribe = function(uid, fid, done) {
  async.waterfall(
    [
      function(callback) {
        User.exists(uid, callback);
      },
      function(exists, callback) {
        if (!exists) return callback('Error: USER NOT FOUND');
        // Find or create feed
        Feed.exists(fid, callback);
      },
      function(exists, callback) {
        if (!exists) return callback('Error: FEED NOT FOUND');
        // Remove feed from user subscriptions
        User._unRegisterSubscribtion(uid, fid, done);
      }
    ],
    function(err) {
      console.log('Error will User.unSubscribe: %s', err);
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
 * Get user's timeline size.
 * @param {String}   uid      User ID.
 * @param {String}   timeline Timeline name.
 * @param {Function} done     Callback with user's timeline size in params.
 */
User.getTimelineSize = function(uid, timeline, done) {
  var key = User.getTimelineKey(uid, timeline);
  Timeline.getSize(key, done);
}

/**
 * Get user's timeline (articles).
 * @param {String}   uid      User ID.
 * @param {String}   timeline Timeline name.
 * @param {Integer}  start    Start element of the range.
 * @param {Integer}  size     Size of the range (default: 10).
 * @param {String}   order    Order: 'ASC' or 'DESC'.
 * @param {Function} done     Callback with user's timeline (article) in params.
 */
User.getTimeline = function(uid, timeline, start, size, order, done) {
  var key = User.getTimelineKey(uid, timeline);
  Timeline.get(key, start, size, order, done);
}

/**
 * Get all timelines of an user.
 * @param {Function} done Callback with timelines in params.
 */
User.getAllTimelines = function(uid, done) {
  var result = [];
  async.waterfall(
    [
      function(callback) {
        // First add global timeline
        result.push(User.getTimelineKey(uid, 'global'));
        // Get all user subscriptions
        db.smembers(User.getSubscriptionsKey(uid), callback);
      },
      function(replies, callback) {
        // Add feed timeline
        var addToResult = function(item, next) {
          result.push(User.getTimelineKey(uid, item));
          next();
        }
        async.map(replies, addToResult, callback);
      },
      function() {
        done(null, result);
      }
    ],
    function(err) {
      console.log('Error will User.getAllTimelines: %s', err);
      done(err);
    }
  );
}

/**
 * Clean old entries of all timelines of an user.
 * @param {String}   uid   User ID.
 * @param {Date}     after Date.
 * @param {Function} done  Callback with no params.
 */
User.cleanTimelines = function(uid, after, done) {
  async.waterfall(
    [
      function(callback) {
        User.getAllTimelines(uid, callback);
      },
      function(timelines) {
        var cleanTimeline = function(timeline, next) {
          console.log('Cleaning timeline %s.', timeline);
          Timeline.clean(timeline, after, next);
        }
        // Clean all...
        async.each(timelines, cleanTimeline, done);
      }
    ],
    function(err) {
      console.log('Error will User.cleanTimelines: %s', err);
      done(err);
    }
  );
}

/**
 * Remove article from the user's timeline.
 * If timeline is the global one, the article is also removed from the feed timeline.
 * If timeline is a feed one, the article is also removed from the global timeline.
 * @param {String}        uid      User ID.
 * @param {String}        timeline Timeline name.
 * @param {String|Object} art      Article or Article ID.
 * @param {Function}      done     Callback with user's timeline size in params.
 */
User.removeArticleFromTimeline = function(uid, timeline, art, done) {
  async.waterfall(
    [
      function (callback) {
        // Get article if art is an aid and not a full article
        if (typeof art === 'string') {
          Article.get(art, callback);
        } else {
          callback(null, art);
        }
      },
      function (article, callback) {
        var key = User.getTimelineKey(uid, timeline);
        // Add article to user feed timeline.
        Timeline.removeArticle(key, article, function(err) {
          callback(err, article);
        });
      },
      function (article, callback) {
        if (timeline == 'global') {
          // Update also feed timeline
          var parts = article.id.split(':');
          var fid = parts[0] + ':' + parts[1];
          var key = User.getTimelineKey(uid, fid);
          Timeline.removeArticle(key, article, callback);
        } else if (timeline != 'archive') {
          // Update also global timeline
          var key = User.getTimelineKey(uid, 'global');
          Timeline.removeArticle(key, article, callback);
        } else {
          // archive timeline: add TTL on saved article
          db.expire(article.id, 86400, callback);
        }
      },
      function () {
        // TODO composite response
        var key = User.getTimelineKey(uid, timeline);
        Timeline.getSize(key, done);
      }
    ],
    function(err) {
      console.log('Error will User.removeArticleFromTimeline: %s', err);
      done(err);
    }
  );
}

/**
 * Add article into the user's timeline.
 * If timeline is the global one, the article is also added to the feed timeline.
 * If timeline is a feed one, the article is also added to the global timeline.
 * @param {String}        uid      User ID.
 * @param {String}        timeline Timeline name.
 * @param {String|Object} art      Article or Article ID.
 * @param {Function}      done     Callback with user's timeline size in params.
 */
User.addArticleToTimeline = function(uid, timeline, art, done) {
  async.waterfall(
    [
      function (callback) {
        // Get article if art is an aid and not a full article
        if (typeof art === 'string') {
          Article.get(art, callback);
        } else {
          callback(null, art);
        }
      },
      function (article, callback) {
        // If is the archive timeline and aid is generic
        // create a persitant copy for the user
        if (timeline == 'archive' && article.id.indexOf('feed:') == 0) {
          Article.copy(article, User.getKey(uid) + ':' + article.id, callback);
        } else {
          callback(null, article);
        }
      },
      function (article, callback) {
        var key = User.getTimelineKey(uid, timeline);
        // Add article to user feed timeline.
        Timeline.addArticle(key, article, function(err, result) {
          callback(err, result, article);
        });
      },
      function (result, article, callback) {
        if (timeline == 'global') {
          // Update also feed timeline
          var parts = article.id.split(':');
          var fid = parts[0] + ':' + parts[1];
          var key = User.getTimelineKey(uid, fid);
          Timeline.addArticle(key, article, callback);
        } else if (timeline != 'archive') {
          // Update also global timeline
          var key = User.getTimelineKey(uid, 'global');
          Timeline.addArticle(key, article, callback);
        } else {
          // archive timeline : remove ttl
          db.persist(article.id, callback);
        }
      },
      function () {
        // TODO composite response
        var key = User.getTimelineKey(uid, timeline);
        Timeline.getSize(key, done);
      }
    ],
    function(err) {
      console.log('Error will User.addArticleToTimeline: %s', err);
      done(err);
    }
  );
}

