var db         = require('../helpers').redis,
    logger     = require('../helpers').logger,
    Feed       = require('./feed'),
    Article    = require('./article'),
    Timeline   = require('./timeline'),
    OpmlParser = require('opmlparser'),
    fs         = require('fs'),
    async      = require('async');

var User = module.exports = function() {};

/**
 * Get user storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getKey = function(uid) {
  if (uid.indexOf('user:') === 0) return uid;
  return 'user:' + uid;
};

/**
 * Get user's global timeline storage key.
 * @param {String} uid      User ID.
 * @param {String} timeline Timeline name.
 * @return {String} Returns the key
 */
User.getTimelineKey = function(uid, timeline) {
  return User.getKey(uid) + ':' + timeline;
};

/**
 * Get user's subscriptions storage key.
 * @param {String} uid User ID.
 * @return {String}    Returns the key
 */
User.getSubscriptionsKey = function(uid) {
  return User.getKey(uid) + ':subscriptions';
};

/**
 * Test if user exists.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with exists status in params.
 */
User.exists = function(uid, done) {
  db.exists(User.getKey(uid), done); 
};

/**
 * User login.
 * Get or create user if auto login is activated. If not, just get the user.
 * @param {Object}   user User.
 * @param {Function} done Callback with user in params.
 */
User.login = function(user, done) {
  var autoGrantAccess = process.env.APP_AUTO_GRANT_ACCESS !== 'false';
  if (autoGrantAccess) {
    User.findOrCreate(user, done);
  } else {
    User.exists(user.uid, function(err, exists) {
      if (err) return done(err);
      if (exists) {
        User.find(user.uid, done);
      } else {
        logger.warn('User %s not authorized.', user.uid);
        done(null, false, { message: 'User not authorized.' });
      }
    });
  }
};

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
      logger.error('Error will User.findOrCreate: %s', err);
      done(err);
    }
  );
};

/**
 * Registering archive provider to an user.
 * @param {Object}   user User.
 * @param {Object}   provider Archive provider infos.
 * @param {Function} done Callback with user in params.
 */
User.registerProvider = function(user, provider, done) {
  var uid = user.uid;
  async.waterfall(
    [
      function(callback) {
        User.find(uid, callback);
      },
      function(user, callback) {
        if (!user.providers) user.providers = {};
        user.providers[provider.name] = {
          access_token: provider.access_token,
          token_type: provider.token_type,
          expires_in: provider.expires_in
        };
        db.hset(User.getKey(uid), 'providers', JSON.stringify(user.providers), callback);
      },
      function() {
        logger.info('Provider %s updated for user %s.', provider.name, uid);
        User.find(uid, done);
      }
    ],
    function(err) {
      logger.error('Error will User.registerProvider: %s', err);
      done(err);
    }
  );
};

/**
 * Find a user.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with user in params.
 */
User.find = function(uid, done) {
  db.hgetall(User.getKey(uid), function(err, user) {
    if (err) return done(err);
    if (user.providers) {
      user.providers = JSON.parse(user.providers);
    }
    done(null, user);
  });
};

/**
 * Get all users (uids).
 * @param {Function} done Callback with uids in params.
 */
User.getAll = function(done) {
  db.smembers('users', done);
};

/**
 * Create an user.
 * Also add user to users set.
 * @param {Object}   user User.
 * @param {Function} done Callback with user in params.
 */
User.create = function(user, done) {
  var uid = user.uid;
  logger.debug('Creating user %s ...', uid);

  user.registrationDate = new Date().getTime().toString();

  async.waterfall(
    [
      function(callback) {
        db.hmset(User.getKey(uid), user, callback);
      },
      function(reply, callback) {
        // Add user to user set.
        db.sadd('users', User.getKey(uid), callback);
      },
      function() {
        logger.info('User %s created.', uid);
        done(null, user);
      }
    ],
    function(err) {
      logger.error('Error will User.create: %s', err);
      done(err);
    }
  );
};

/**
 * Delete an user.
 * @param {String}   uid  User ID.
 * @param {Function} done Callback with no params.
 */
User.del = function(uid, done) {
  logger.debug('Deleting user %s ...', uid);

  async.waterfall(
    [
      function(callback) {
        User.exists(uid, callback);
      },
      function(exists, callback) {
        if (!exists) return callback('Error: USER NOT FOUND');
        // Clean all timelines.
        User.removeAllArticlesFromTimeline(uid, 'global', callback);
      },
      function(reply, callback) {
        logger.debug('User\'s timelines cleaned.');
        // Get subscriptions
        db.smembers(User.getSubscriptionsKey(uid), callback);
      },
      function(replies, callback) {
        // Un register subsciption...
        var removeSubscription = function(fid, next) {
          User._unRegisterSubscribtion(uid, fid, next);
        };
        async.map(replies, removeSubscription, callback);
      },
      function(reply, callback) {
        // Delete subscriptions
        db.del(User.getSubscriptionsKey(uid), callback);
      },
      function(reply, callback) {
        logger.debug('User\'s subscriptions deleted.');
        db.srem('users', User.getKey(uid), callback);
      },
      function(reply, callback) {
        logger.debug('User removed from members.');
        // Delete user.
        db.del(User.getKey(uid), callback);
      },
      function(reply) {
        logger.debug('User deleted.');
        done(null);
      }
    ],
    function(err) {
      logger.error('Error will User.del: %s', err);
      done(err);
    }
  );
};

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
};

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
        db.sadd(Feed.getSubscribersKey(fid), User.getKey(uid), callback);
      },
      function(reply, callback) {
        // Add feed articles to user feed timeline.
        Timeline.addAllArticles(Feed.getArticlesKey(fid), User.getTimelineKey(uid, fid), callback);
      },
      function(reply) {
        // Add feed articles to user global timeline.
        Timeline.addAllArticles(Feed.getArticlesKey(fid), User.getTimelineKey(uid, 'global'), done);
      }
    ],
    function(err) {
      logger.error('Error will User._registerSubscribtion: %s', err);
      done(err);
    }
  );
};

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
        db.srem(Feed.getSubscribersKey(fid), User.getKey(uid), callback);
      },
      function(reply) {
        // Remove articles from timeline (and also the timeline...)
        User.removeAllArticlesFromTimeline(uid, User.getTimelineKey(uid, fid), done);
      }
    ],
    function(err) {
      logger.error('Error will User._unRegisterSubscribtion: %s', err);
      done(err);
    }
  );
};

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
      logger.error('Error will User.subscribe: %s', err);
      done(err);
    }
  );
};

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
      logger.error('Error will User.unSubscribe: %s', err);
      done(err);
    }
  );
};


/**
 * Import OPML file for a user.
 * Create feeds if not exists and subscribe the user to each feed.
 * @param {String}   uid  User ID.
 * @param {Object}   file OPML file.
 * @param {Function} done Callback with new user's subscriptions (Feeds) in params.
 */
User.importSubscriptions = function(uid, file, done) {
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
      if (feeds === null) return done('No subscriptions found in this file.');
      async.each(feeds, processFeed, function(e) {
        done(e, feeds);
      });
    });
  });
};

/**
 * Get user's timeline status.
 * @param {String}   uid      User ID.
 * @param {String}   timeline Timeline name.
 * @param {Function} done     Callback with user's timeline status in params.
 */
User.getTimelineStatus = function(uid, timeline, done) {
  var key = User.getTimelineKey(uid, timeline);
  Timeline.getStatus(key, done);
};

/**
 * Get all user's timelines status.
 * @param {String}   uid      User ID.
 * @param {Function} done     Callback with all user's timelines status in params.
 */
User.getAllTimelinesStatus = function(uid, done) {
  async.waterfall(
    [
      function(callback) {
        // Get all user timelines
        User.getAllTimelines(uid, callback);
      },
      function(timelines, callback) {
        // Get all status
        async.map(timelines, Timeline.getStatus, done);
      }
    ],
    function(err) {
      logger.error('Error will User.getAllTimelinesStatus: %s', err);
      done(err);
    }
  );
};

/**
 * Get user's timeline (articles).
 * @param {String}   uid      User ID.
 * @param {String}   timeline Timeline name.
 * @param {Object}   options  Options: next, size, order, show.
 * @param {Function} done     Callback with user's timeline (article) in params.
 */
User.getTimeline = function(uid, timeline, options, done) {
  var key = null;
  if (timeline !== 'global'  &&
      options.show && options.show === 'all') {
    key = Feed.getArticlesKey(timeline);
  } else {
    key = User.getTimelineKey(uid, timeline);
  }

  Timeline.get(key, options.next, options.size, options.order, done);
};

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
        };
        async.map(replies, addToResult, callback);
      },
      function() {
        done(null, result);
      }
    ],
    function(err) {
      logger.error('Error will User.getAllTimelines: %s', err);
      done(err);
    }
  );
};

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
          logger.debug('Cleaning timeline %s.', timeline);
          Timeline.removeArticlesAfter(timeline, after, next);
        };
        // Clean all...
        async.each(timelines, cleanTimeline, done);
      }
    ],
    function(err) {
      logger.error('Error will User.cleanTimelines: %s', err);
      done(err);
    }
  );
};

/**
 * Remove article from the user's timeline.
 * If timeline is the global one, the article is also removed from the feed timeline.
 * If timeline is a feed one, the article is also removed from the global timeline.
 * @param {String}        uid      User ID.
 * @param {String}        timeline Timeline name.
 * @param {String}        aid      Article ID.
 * @param {Function}      done     Callback with user's timeline size in params.
 */
User.removeArticleFromTimeline = function(uid, timeline, aid, done) {
  async.waterfall(
    [
      function (callback) {
        var key = User.getTimelineKey(uid, timeline);
        // Remove article from user's timeline.
        Timeline.removeArticle(key, {id: aid}, callback);
      },
      function (reply, callback) {
        var key = null;
        if (timeline == 'global') {
          // Update also feed timeline
          var fid = Feed.assertKey(aid);
          key = User.getTimelineKey(uid, fid);
          Timeline.removeArticle(key, {id: aid}, callback);
        } else {
          // Update also global timeline
          key = User.getTimelineKey(uid, 'global');
          Timeline.removeArticle(key, {id: aid}, callback);
        }
      },
      function () {
        var key = User.getTimelineKey(uid, timeline);
        Timeline.getStatus(key, done);
      }
    ],
    function(err) {
      logger.error('Error will User.removeArticleFromTimeline: %s', err);
      done(err);
    }
  );
};

/**
 * Remove all articles from the user's timeline.
 * If timeline is the global one, articles are also removed from the feed timeline.
 * If timeline is a feed one, articles are also removed from the global timeline.
 * @param {String}        uid      User ID.
 * @param {String}        timeline Timeline name.
 * @param {Function}      done     Callback with user's timeline size in params.
 */
User.removeAllArticlesFromTimeline = function(uid, timeline, done) {
  async.waterfall(
    [
      function (callback) {
        if (timeline == 'global') {
          // Remove all articles of all timelines
          User.getAllTimelines(uid, callback);
        } else {
          // Remove feed's articles from global timeline
          var key = User.getTimelineKey(uid, timeline);
          var globalKey = User.getTimelineKey(uid, 'global');
          Timeline.removeIntersectArticles(globalKey, key, function(err, reply) {
            callback(err, [key]);
          });
        }
      },
      function (timelines, callback) {
        // Remove all articles from user's timeline.
        async.each(timelines, Timeline.removeAllArticles, callback);
      },
      function () {
        var key = User.getTimelineKey(uid, timeline);
        Timeline.getStatus(key, done);
      }
    ],
    function(err) {
      logger.error('Error will User.removeAllArticlesFromTimeline: %s', err);
      done(err);
    }
  );
};

/**
 * Add article into the user's timeline.
 * If timeline is the global one, the article is also added to the feed timeline.
 * If timeline is a feed one, the article is also added to the global timeline.
 * @param {String}        uid      User ID.
 * @param {String}        timeline Timeline name.
 * @param {String}        aid      Article ID.
 * @param {Function}      done     Callback with user's timeline size in params.
 */
User.addArticleToTimeline = function(uid, timeline, aid, done) {
  async.waterfall(
    [
      function (callback) {
        // Retrieve the article
        Article.get(aid, callback);
      },
      function (article, callback) {
        var key = User.getTimelineKey(uid, timeline);
        // Add article to user feed timeline.
        Timeline.addArticle(key, article, function(err, reply) {
          callback(err, article);
        });
      },
      function (article, callback) {
        var key = null;
        if (timeline == 'global') {
          // Update also feed timeline
          var fid = Feed.assertKey(article.id);
          key = User.getTimelineKey(uid, fid);
          Timeline.addArticle(key, article, callback);
        } else {
          // Update also global timeline
          key = User.getTimelineKey(uid, 'global');
          Timeline.addArticle(key, article, callback);
        }
      },
      function () {
        var key = User.getTimelineKey(uid, timeline);
        Timeline.getStatus(key, done);
      }
    ],
    function(err) {
      logger.error('Error will User.addArticleToTimeline: %s', err);
      done(err);
    }
  );
};
