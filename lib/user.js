var db = require('./db')
  , Feed = require('./feed')
  , Article = require('./article')
  , OpmlParser = require('opmlparser')
  , fs = require('fs')
  , async = require('async');

var User = module.exports = function() {};

User.getKey = function(uid) {
  return 'user:' + uid;
}

User.getTimelineKey = function(uid) {
  return 'user:' + uid + ':timeline';
}

User.getSubscriptionsKey = function(uid) {
  return 'user:' + uid + ':subscriptions';
}

User.exists = function(uid, done) {
  db.exists(User.getKey(uid), done); 
}

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

User.find = function(uid, done) {
  db.hgetall(User.getKey(uid), done);
}

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

User.getSubscriptions = function(uid, done) {
  var getFeed = function(key, callback) {
    db.hgetall(key, callback);
  }

  db.smembers(User.getSubscriptionsKey(uid), function(err, replies) {
    if (err) return done(err);
    async.map(replies, getFeed, done);
  });
}

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

User.import = function(uid, file, done) {
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

User.getTimelineSize = function(uid, done) {
  db.zcount(User.getTimelineKey(uid), '-inf', '+inf', function(err, reply) {
    if (err) return done(err);
    done(null, {total: reply});
  });
}

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


