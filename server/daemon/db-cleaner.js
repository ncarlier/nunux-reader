#!/usr/bin/env node

'use strict';

var STANDALONE = module.parent ? false : true;

if (STANDALONE) {
  process.title = 'reader-db-cleaner';
}

var _        = require('underscore'),
    appInfo  = require('../../package.json'),
    program  = require('commander'),
    CronJob  = require('cron').CronJob,
    async    = require('async'),
    db       = require('../helpers').redis,
    logger   = require('../helpers').logger,
    User     = require('../models/user'),
    Timeline = require('../models/timeline'),
    Feed     = require('../models/feed');


/**
 * Database cleaner daemon.
 */
function DbCleanerDaemon(days) {
  this.days = days;
}

/**
 * Clean database.
 */
DbCleanerDaemon.prototype.clean = function(clbk) {
  var _after = new Date();
  _after.addDays(- this.days);
  logger.info('Cleaning database...');
  logger.info('Cleaning older entries than %s...', _after.toString());
  async.waterfall(
    [
      function(callback) {
        // Get all users
        User.getAll(callback);
      },
      function(uids, callback) {
        var cleanUserTimelines = function(uid, next) {
          logger.info('Cleaning timelines of %s.', uid);
          User.cleanTimelines(uid, _after, next);
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
            if (err) {
              return next(err);
            }
            if (nb > 0) {
              logger.info('Deleting old entries of feed %s...', fid);
              Timeline.deleteArticlesAfter(fid + ':articles', _after, next);
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
        clbk();
      }
    ],
    function(err) {
      logger.error('Error while cleaning database.', err);
      clbk(err);
    }
  );
};


/**
 * Start daemon.
 */
DbCleanerDaemon.prototype.start = function() {
  logger.info('Starting db cleaner daemon...');
  if (STANDALONE) {
    db.on('connect', function() {
      this.clean(function(err) {
        this.stop(err ? 1 : 0);
      }.bind(this));
    }.bind(this));
  } else {
    this.job = new CronJob({
      cronTime: '00 00 00 * * *',
      onTick: this.clean,
      start: false
    });
    this.job.start();
  }
};

/**
 * Stop daemon.
 * @param {Integer} returnCode code to return
 */
DbCleanerDaemon.prototype.stop = function(returnCode) {
  logger.info('Stopping db cleaner daemon...');
  if (STANDALONE) {
    db.quit(function (err) {
      logger.error(err || 'Stopping db cleaner daemon: done.');
      process.exit(err ? 1 : returnCode);
    });
  } else {
    this.job.stop();
    logger.error('Stopping db cleaner daemon: done.');
  }
};

if (STANDALONE) {
  // Create standalone daemon. Aka self executable.
  program.version(appInfo.version)
  .option('-y, --days [days]', 'Nb of days to keep', process.env.APP_DAYS_TO_KEEP || 30)
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

  logger.level(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

  program.days = parseInt(program.days, 10);

  var app = new DbCleanerDaemon(program.days);
  // Start the daemon
  app.start();

  // Graceful shutdown.
  _.each(['SIGINT', 'SIGTERM', 'SIGQUIT'], function(signal) {
    process.on(signal, function() {
      app.stop((signal === 'SIGINT') ? 1 : 0);
    });
  });
}
else {
  var days = process.env.APP_DAYS_TO_KEEP ? parseInt(process.env.APP_DAYS_TO_KEEP, 10) : 30;

  // Export daemon instance
  module.exports = new DbCleanerDaemon(days);
}


