var redis = require('redis')
  , logger = require('./logger')
  , db = redis.createClient();

db.on('error', function (err) {
  logger.error('Redis error: %j', err);
});

if (process.env.APP_DB) {
  db.select(parseInt(process.env.APP_DB, 10));
}

module.exports = db;
