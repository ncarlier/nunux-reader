var should = require('should')
  , path = require('path')
  , db = require('../lib/db')
  , logger = require('../lib/logger')
  , User = require('../lib/user');

logger.setLevel('info');
db.select(9);

describe('A new User', function() {
  var user
    , uid = 'test@test.com'
    , url = 'http://feeds.feedburner.com/KorbensBlog-UpgradeYourMind'
    , fid = 'feed:4d32abddd88fd326673004a92b434f94'
    , file = path.join(__dirname, 'data', 'subscriptions.xml');
  before(function(done) {
    User.create({uid: uid} , function(err,u) {
      user = u;
      done();
    });
  });

  it('should have a registration date', function() {
    user.should.have.property('registrationDate');
  });
  it('should then exist', function(done) {
    User.exists(uid, function(err, exists) {
      if (err) return done(err);
      exists.should.be.ok;
      done();
    });
  });
  it('should be retrieve', function(done) {
    User.find(uid, function(err, u) {
      if (err) return done(err);
      u.uid.should.equal(uid);
      done();
    });
  });
  it('should be able to subscribe a feed', function(done) {
    User.subscribe(uid, url, function(err, feed) {
      if (err) return done(err);
      feed.xmlurl.should.equal(url);
      done();
    });
  });
  it('should import OPML file', function(done) {
    User.import(uid, file, function(err) {
      if (err) return done(err);
      User.getSubscriptions(uid, function(err, feeds) {
        if (err) return done(err);
        feeds.should.not.be.empty;
        feeds.should.have.length(2);
        done();
      });
    });
  });
  it('should be able to un-subscribe a feed', function(done) {
    User.unSubscribe(uid, fid, function(err) {
      if (err) return done(err);
      done();
    });
  });
  it('should have subscriptions', function(done) {
    User.getSubscriptions(uid, function(err, feeds) {
      if (err) return done(err);
      feeds.should.not.be.empty;
      feeds.should.have.length(1);
      done();
    });
  });
});

