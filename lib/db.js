var redis   = require('redis');


var uri = null;
if (process.env.DB_PORT) {
  // Run with Docker
  // DB_PORT=tcp://172.17.0.3:6379
  uri = process.env.DB_PORT.replace(/^tcp/, 'redis');
  uri = uri + '/5';
} else {
  uri = process.env.APP_REDIS_URI || 'redis://localhost:6379/5';
}

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

client = connect(uri);

/**
 * Redis helper.
 * @module redis
 */
module.exports = client;

