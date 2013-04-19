var db = require('./db')
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

User.findOrCreate = function(user, done) {
  var uid = user.uid;
  async.waterfall(
    [
      function(callback) {
        db.exists(User.getKey(uid), callback); 
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

  var newUser = {
    registrationDate: new Date().getTime().toString()
  }

  db.hmset(User.getKey(uid), newUser, function(err, reply) {
    if (err) return done(err);
    console.log('User %s created: %s', uid, reply);
    done(null, newUser);
  });
}
