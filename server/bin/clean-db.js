#!/usr/bin/env node

require('date-utils');
var program = require('commander'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    User = require('../lib/user'),
    Timeline = require('../lib/timeline'),
    Feed = require('../lib/feed'),
    async = require('async');

program
  .version('0.0.1')
  .option('-y, --days [days]', 'Nb of days to keep', process.env.APP_DAYS_TO_KEEP || 30)
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

logger.setLevel(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

var after = new Date();

program.days = parseInt(program.days, 10);
after.addDays(- program.days);

logger.info('Cleaning database...');
logger.info('Cleaning older entries than %s...', after.toString());

var main = function() {
  async.waterfall(
    [
      function(callback) {
        // Get all users
        User.getAll(callback);
      },
      function(uids, callback) {
        var cleanUserTimelines = function(uid, next) {
          logger.info('Cleaning timelines of %s.', uid);
          User.cleanTimelines(uid, after, next);
        };
        async.each(uids, cleanUserTimelines, callback);
      },
      function(callback) {
        logger.info('All timelines cleaned. Now cleaning feeds...');
        // Get all feeds
        Feed.getAll(callback);
      },
      function(fids, callback) {
        var cleanFeed = function(fid, next) {
          Feed.countSubscribers(fid, function(err, nb) {
            if (err) return next(err);
            if (nb > 0) {
              logger.info('Deleting old entries of feed %s...', fid);
              Timeline.deleteArticlesAfter(fid + ':articles', after, next);
            } else {
              logger.info('No more subscriber. Deleting feed %s...', fid);
              Feed.del(fid, next);
            }
          });
        };
        async.each(fids, cleanFeed, callback);
      },
      function() {
        logger.info('Feeds cleaned.');
        logger.info('Database cleaned.');
        db.quit();
      }
    ],
    function(err) {
      logger.error('Error: %s', err);
      db.quit();
    }
  );
};

db.on('connect', main);
