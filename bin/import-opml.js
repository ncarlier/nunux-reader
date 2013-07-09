#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    User = require('../lib/user');

program
  .version('0.0.1')
  .option('-u, --user [user]', 'User subscription OPML file')
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

logger.setLevel(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

var file = program.args[0];
var uid = program.user;

logger.info('Import OPML file: %s for %s ...', file, uid);

db.on('connect', function() {
  User.import(uid, file, function(err) {
    db.quit();
    if (err) {
      return logger.error(err);
    }
    logger.info('Import OPML file: %s for %s done.', file, uid);
  });
});


