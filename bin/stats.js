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
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

logger.setLevel(program.debug ? 'debug' : 'info');

logger.info('Database statistics...');

var main = function() {
  async.waterfall(
    [
      function(callback) {
        // Get all users
        User.getAll(callback);
      },
      function(uids, callback) {
        logger.info('Nb of users: %d', uids.length);

        // Get users stats.
        var getUserStats = function(uid, next) {
          User.getAllTimelinesStatus(uid, function(err, result) {
            if (err) return next(err);
            logger.info('User %s have %d timelines.', uid, result.length);
            logger.info('User %s have %d articles in %s timeline.', uid, result[0].size, result[0].timeline);
            logger.info('User %s have %d articles in %s timeline.', uid, result[1].size, result[1].timeline);
            next(null);
          });
        };
        async.each(uids, getUserStats, callback);
      },
      function(callback) {
        // Get all feed status
        Feed.getAll(callback);
      },
      function(fids, callback) {
        logger.info('Nb of feeds: %d', fids.length);

        var getFeedStats = function(fid, next) {
          Feed.get(fid, function(err, feed) {
            if (err) return next(err);
            logger.info('Feed %s status: %s', feed.id, feed.status);
            next(null);
          });
        };
        async.each(fids, getFeedStats, callback);
      },
      function() {
        logger.info('Database statistics.done.');
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
