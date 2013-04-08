#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    redis = require('redis'),
    async = require('async'),
    client = redis.createClient();

program
  .version('0.0.1')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

var user = {
  email: program.email,
  //creationDate: new Date().getTime()
}

client.on('error', function (err) {
  console.log('Error ' + err);
});

client.on('connect', function() {
  var createUser = function(email, callback) {
    console.log('Create user %s ...', email);
    var user = {
      email: email,
      registrationDate: new Date().getTime().toString()
    }
    client.hmset('user:' + user.email, user, function(err, reply) {
      if (err) {
        callback(err);
      } else {
        console.log('User %s created: %s', user.email, reply);
        callback(null);
      }
    });
  }

  async.each(program.args, createUser, function(err) {
    if (err) {
      console.log(err);
    }
    client.quit();
  });
});


