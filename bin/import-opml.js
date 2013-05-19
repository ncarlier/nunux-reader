#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander')
  , db = require('../lib/db')
  , User = require('../lib/user');

program
  .version('0.0.1')
  .option('-u, --user [user]', 'User subscription OPML file')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

var file = program.args[0];
var uid = program.user;

console.log('Import OPML file: %s for %s ...', file, uid);

db.on('connect', function() {
  User.import(uid, file, function(err) {
    db.quit();
    if (err) {
      return console.log(err);
    }
    console.log('Import OPML file: %s for %s done.', file, uid);
  });
});


