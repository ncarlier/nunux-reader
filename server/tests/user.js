var should  = require('should'),
    path    = require('path'),
    db      = require('../helpers').redis,
    logger  = require('../helpers').logger,
    Article = require('../models/article');
    Feed    = require('../models/feed');
    User    = require('../models/user');

logger.level('info');
db.select(9);

describe('A new user', function() {
  var uid = 'foo@bar.com',
      feed = {
        xmlurl: 'http://feeds.feedburner.com/KorbensBlog-UpgradeYourMind'
      },
      article = {
        date: new Date(),
        pubdate: new Date(),
        title: 'Foo article',
        link: 'http://foo.bar/new',
        description: '...',
        meta: {
        }
      },
      file = path.join(__dirname, 'data', 'subscriptions.xml');
  before(function(done) {
    Feed.create(feed, function(err, f) {
      if (err) return done(err);
      feed = f;
      Article.create(article, feed, function(err, a) {
        article = a;
        done(err);
      });
    });
  });
  it('should be created', function(done) {
    User.create({uid: uid}, function(err, user) {
      if (err) return done(err);
      user.should.have.property('registrationDate');
      done();
    });
  });
  it('should then exist', function(done) {
    User.exists(uid, function(err, exists) {
      if (err) return done(err);
      exists.should.be.ok;
      done();
    });
  });
  it('should be retrieve', function(done) {
    User.find(uid, function(err, user) {
      if (err) return done(err);
      user.uid.should.equal(uid);
      done();
    });
  });
  it('should be able to subscribe a feed', function(done) {
    User.subscribe(uid, feed.xmlurl, function(err, f) {
      if (err) return done(err);
      f.xmlurl.should.equal(feed.xmlurl);
      done();
    });
  });
  it('should import OPML file', function(done) {
    User.importSubscriptions(uid, file, function(err) {
      if (err) return done(err);
      User.getSubscriptions(uid, function(err, feeds) {
        if (err) return done(err);
        feeds.should.not.be.empty;
        feeds.should.have.length(2);
        done();
      });
    });
  });
  it('should have a global timeline', function(done) {
    User.getTimelineStatus(uid, 'global', function(err, status) {
      if (err) return done(err);
      status.title.should.equal('All items');
      status.size.should.equal(1);
      status.should.not.have.property('feed');
      done();
    });
  });
  it('should have a feed timeline', function(done) {
    User.getTimelineStatus(uid, feed.id, function(err, status) {
      if (err) return done(err);
      status.should.have.property('feed');
      status.feed.id.should.equal(feed.id);
      status.size.should.equal(1);
      done();
    });
  });
  it('should get content of the feed timeline', function(done) {
    var options = {};
    User.getTimeline(uid, feed.id, options, function(err, result) {
      if (err) return done(err);
      result.should.not.have.property('next');
      result.should.not.have.property('order');
      result.articles.should.not.be.empty;
      result.articles[0].link.should.equal(article.link);
      done();
    });
  });
  it('should remove an article from the feed timeline', function(done) {
    User.removeArticleFromTimeline(uid, feed.id, article.id, function(err, status) {
      if (err) return done(err);
      status.should.have.property('feed');
      status.feed.id.should.equal(feed.id);
      status.size.should.equal(0);
      done();
    });
  });
  it('should have no more article in global timeline', function(done) {
    User.getTimelineStatus(uid, 'global', function(err, status) {
      if (err) return done(err);
      status.title.should.equal('All items');
      status.size.should.equal(0);
      done();
    });
  });
  it('should be able to un-subscribe a feed', function(done) {
    User.unSubscribe(uid, feed.id, function(err) {
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

