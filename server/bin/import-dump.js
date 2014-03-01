#!/usr/bin/env node

var program = require('commander'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    User = require('../lib/user');

program
  .version('0.0.1')
  .usage('[options] <file>')
  .option('-u, --user [user]', 'Target user')
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

if (program.args.length <= 0 || !program.user) program.help();

logger.setLevel(program.debug ? 'debug' : program.verbose ? 'info' : 'warn');

var file = program.args[0],
    uid = program.user,
    user = null;

logger.info('Import article\'s dump file (Google Reader format): %s for %s ...', file, uid);

db.on('connect', function() {
  User.importArticles(uid, file, function(err) {
    // Async process... so waiting a bit. Okay it's not clean,
    // but JSONStream don't have proper callback.
    setTimeout(function(){
      db.quit();
      if (err) {
        return logger.error(err);
      }
      logger.info('Import article\'s dump file: %s for %s done.', file, uid);
    }, 2000);
  });
});

