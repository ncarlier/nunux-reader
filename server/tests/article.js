require('date-utils');
var should  = require('should'),
    path    = require('path'),
    db      = require('../helpers').redis,
    logger  = require('../helpers').logger,
    Article = require('../models/article');

logger.setLevel('info');
db.select(9);

describe('An new article', function() {
  var uid = 'user:foo@bar.com';
  var fid = 'feed:test';
  var aid = fid + ':e133a7b26a7701b1d65a61683e50512b';
  var article = {
    date: new Date(),
    pubdate: new Date(),
    title: 'Test article',
    link: 'http://foo.bar',
    description: '...',
    badAttribute: 'evil is my name',
    meta: {
    }
  };

  before(function(done) {
    db.flushdb(done);
  });

  it('should be created and clean', function(done) {
    Article.create(article, {id: fid}, function(err, art) {
      if (err) return done(err);
      art.id.should.equal(aid);
      should.not.exist(art.badAttribute);
      Article.assertKey(art.id).should.be.ok;
      done();
    });
  });
  it('but not twice', function(done) {
    Article.create(article, {id: fid}, function(err, art) {
      err.should.equal('EEXIST');
      should.not.exist(art);
      done();
    });
  });
  it('should be retrieve', function(done) {
    Article.get(aid, function(err, art) {
      if (err) return done(err);
      art.id.should.equal(aid);
      art.fid.should.equal(fid);
      done();
    });
  });
  it('should be deleted', function(done) {
    Article.del(aid, function(err) {
      if (err) return done(err);
      done();
    });
  });
  it('and should not be retrieve', function(done) {
    Article.get(aid, function(err, art) {
      err.should.equal('ENOTFOUND');
      should.not.exist(art);
      done();
    });
  });
});

describe('An bad article', function() {
  var fid = 'feed:test';
  var aid = fid + ':cb0b35ab1c8d3301769a89258ceb1481';
  var article = {
    date: new Date(),
    pubdate: new Date(),
    link: 'http://foo.bar/bad',
    description: '...',
    meta: {
    }
  };

  it('should not be created because missing attribute', function(done) {
    Article.create(article, {id: fid}, function(err, art) {
      err.should.equal('EATTRIBUTE');
      should.not.exist(art);
      done();
    });
  });
  it('should not be created because too old', function(done) {
    article.title = "Foo title";
    article.pubdate.addDays(-300);
    Article.create(article, {id: fid}, function(err, art) {
      err.should.equal('ETOOOLD');
      should.not.exist(art);
      done();
    });
  });
  it('and should not be retrieve', function(done) {
    Article.get(aid, function(err, art) {
      err.should.equal('ENOTFOUND');
      should.not.exist(art);
      done();
    });
  });
});

