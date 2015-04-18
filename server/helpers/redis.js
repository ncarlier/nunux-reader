var redis  = require('redis'),
    url    = require('url'),
    logger = require('./logger');

/**
 * Get Redis URI.
 * @return {String} Redis string URI
 */
var getRedisUri = function() {
  switch(true) {
    case process.env.APP_REDIS_URI !== undefined:
      return process.env.APP_REDIS_URI;
    case process.env.OPENREDIS_URL !== undefined:
      return process.env.OPENREDIS_URL;
    case process.env.REDISCLOUD_URL !== undefined:
      return process.env.REDISCLOUD_URL;
    default:
      return 'redis://localhost:6379/0';
  }
};

/**
 * Connect to redis.
 * @param {String} str Redis string URI
 */
var connect = function(str) {
  var u = url.parse(str);

  var redisClient = redis.createClient(u.port, u.hostname);
  if (u.auth) {
    redisClient.auth(u.auth.split(':')[1], function(err) {
      if (err) {
        logger.error('Unable to connect to redis host: ' + str);
        throw new Error(err);
      }
      if (u.pathname) redisClient.select(u.pathname.substring(1));
    });
  } else {
    if (u.pathname) redisClient.select(u.pathname.substring(1));
  }
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


