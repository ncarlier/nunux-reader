var redis = require('redis')
  , db = redis.createClient();

db.on('error', function (err) {
  console.log('Error ' + err);
});

module.exports = db;
