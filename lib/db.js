var redis = require('redis')
  , logger = require('./logger')
  , db = redis.createClient();

db.on('error', function (err) {
  logger.error('Redis error: %j', err);
});

module.exports = db;
