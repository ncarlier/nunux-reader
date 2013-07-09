#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    User = require('../lib/user'),
    async = require('async');

program
  .version('0.0.1')
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

logger.setLevel(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

db.on('connect', function() {
  var createUser = function(email, callback) {
    User.create({uid: email}, callback);
  };

  async.each(program.args, createUser, function(err) {
    if (err) {
      logger.error(err);
    }
    db.quit();
  });
});


