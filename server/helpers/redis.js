var redis  = require('redis'),
    logger = require('./logger');

/**
 * Get Redis URI.
 * @return {String} Redis string URI
 */
var getRedisUri = function() {
  var uri = 'redis://localhost:6379/0';
  if (process.env.APP_REDIS_URI) {
    uri = process.env.APP_REDIS_URI;
  }
  return uri;
};

/**
 * Connect to redis.
 * @param {String} str Redis string URI
 */
var connect = function(str) {
  var match = /^redis:\/\/([a-z0-9\.]+):(\d+)\/(\d)$/.exec(str);
  if (!match) {
    throw new Error('Invalid redis uri: ' + str);
  }
  var host = match[1],
      port = parseInt(match[2]),
      db   = parseInt(match[3]);

  var redisClient = redis.createClient(port, host);
  redisClient.select(db);
  return redisClient;
};

var client = connect(getRedisUri());

client.on("error", function (err) {
  logger.error("Redis error encountered", err);
});

client.on("end", function() {
  logger.info("Redis connection closed");
});

/**
 * Redis helper.
 * @module redis
 */
module.exports = client;


