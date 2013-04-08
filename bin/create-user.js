#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    redis = require('redis'),
    client = redis.createClient();

program
  .version('0.0.1')
  .option('-e, --email [email]', 'User email', 'email')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

console.log('Create user %s ...', program.email);

var user = {
  email: program.email,
  //creationDate: new Date().getTime()
}

client.on('error', function (err) {
  console.log('Error ' + err);
});

client.on('connect', function() {
  client.hmset('user:' + user.email, user, function(err, reply) {
    if (err) {
      console.log(err);
    } else {
      console.log('User %s created: %s', user.email), reply;
    }
    client.quit();
  });
});


