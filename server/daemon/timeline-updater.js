#!/usr/bin/env node

'use strict';

var STANDALONE = module.parent ? false : true;

if (STANDALONE) {
  process.title = 'reader-timeline-updater';
}

var _            = require('underscore'),
    appInfo      = require('../../package.json'),
    program      = require('commander'),
    EventEmitter = require('events').EventEmitter,
    async        = require('async'),
    logger       = require('../helpers').logger,
    db           = require('../helpers').redis,
    Feed         = require('../models/feed'),
    User         = require('../models/user');


/**
 * Update timelines.
 * @param {Function} next Next callback
 */
function updateTimelines(next) {
  async.waterfall(
    [
      function(callback) {
        // Get article key to integrate...
        db.blpop('articles:integration', 5, callback);
      },
      function(replies, callback) {
        if (replies === null) {
          return next(null);
        }
        // Get article from db...
        var aid = replies[1];
        logger.debug('Integrating article %s...', aid);
        var updateUserTimelines = function(uid, next) {
          User.addArticleToTimeline(uid, 'global', aid, next);
        };
        // Get feed subscribers...
        var parts = aid.split(':');
        var fid = parts[0] + ':' + parts[1];
        Feed.getSubscribers(fid, function(err, uids) {
          if (err) {
            return callback(err);
          }
          async.each(uids, updateUserTimelines, callback);
        });
      },
      function() {
        return next(null);
      }
    ],
    next
  );
}

/**
 * Timeline updater daemon.
 */
function TimelineUpdaterDaemon() {
  this.stopped = false;
  this.listener = new EventEmitter();
  this.listener.on('next', function() {
    updateTimelines(function(err) {
      if (err) {
        logger.error('Error: %s', err);
      }
      if (!this.stopped) {
        this.listener.emit('next');
      }
    }.bind(this));
  }.bind(this));
}

/**
 * Start daemon.
 */
TimelineUpdaterDaemon.prototype.start = function() {
  logger.info('Starting timeline updater daemon...');
  if (STANDALONE) {
    db.on('connect', function() {
      this.listener.emit('next');
    }.bind(this));
  } else {
    this.listener.emit('next');
  }
};

/**
 * Stop daemon.
 * @param {Integer} returnCode code to return
 */
TimelineUpdaterDaemon.prototype.stop = function(returnCode) {
  logger.info('Stopping timeline updater daemon...');
  if (STANDALONE) {
    db.quit(function (err) {
      logger.error(err || 'Stopping timeline updater daemon: done.');
      process.exit(err ? 1 : returnCode);
    });
  } else {
    this.stopped = true;
    logger.error('Stopping timeline updater daemon: done.');
  }
};

if (STANDALONE) {
  // Create standalone daemon. Aka self executable.
  program.version(appInfo.version)
  .option('-v, --verbose', 'Verbose flag')
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

  logger.level(program.debug ? 'debug' : program.verbose ? 'info' : 'error');

  var app = new TimelineUpdaterDaemon();
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
  // Export daemon instance
  module.exports = new TimelineUpdaterDaemon();
}


