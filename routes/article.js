var redis = require('redis')
	, async = require('async');

var db = redis.createClient();

db.on('error', function (err) {
  console.log('Error ' + err);
});

/*
 * GET article listing.
 */
exports.list = function(req, res, next) {
	console.log('query: %j', req.query);
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
};
