#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    db = require('../lib/db'),
    User = require('../lib/user'),
    async = require('async');

program
  .version('0.0.1')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

db.on('connect', function() {
  var createUser = function(email, callback) {
    User.create({uid: email}, callback);
  }

  async.each(program.args, createUser, function(err) {
    if (err) {
      console.log(err);
    }
    db.quit();
  });
});


