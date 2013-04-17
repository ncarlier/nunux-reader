var db = require('../lib/db')
  , async = require('async');

module.exports = function(app){
  /**
   * GET article listing.
   */
  app.get('/article', function(req, res, next) {
    // console.log('query: %j', req.query);
    var getArticle = function(key, callback) {
      db.get(key, function(err, article) {
        if (err) return callback(err);
        callback(null, JSON.parse(article));
      });
    }
    var key = 'user:nicolas@nunux.org:playlist';
    //ZRANGEBYSCORE myzset -inf +inf
    db.zrangebyscore(key, '-inf', '+inf', 'LIMIT', req.query.offset, '10', function(err, replies) {
      if (err) return next(err);
      async.map(replies, getArticle, function(err, results){
        if (err) return next(err);
        res.json(results);
      });
    });
  });

  /**
   * GET total articles.
   */
  app.get('/article/total', function(req, res, next) {
    var key = 'user:nicolas@nunux.org:playlist';
    db.zcount(key, '-inf', '+inf', function(err, reply) {
      if (err) return next(err);
      res.json({total: reply});
    });
  });

};
