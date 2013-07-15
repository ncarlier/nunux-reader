#!/usr/bin/env node

var program = require('commander'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    User = require('../lib/user'),
    async = require('async');

program
  .version('0.0.1')
  .usage('[options] <mail ...>')
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

if (program.args.length <= 0) program.help();

logger.setLevel(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

db.on('connect', function() {
  var deleteUser = function(email, callback) {
    User.remove(email, callback);
  };

  async.each(program.args, deleteUser, function(err) {
    if (err) {
      logger.error(err);
    }
    db.quit();
  });
});


