#!/usr/bin/env node

require('date-utils');
var program = require('commander'),
    db = require('../lib/db'),
    User = require('../lib/user'),
    Timeline = require('../lib/timeline'),
    Feed = require('../lib/feed'),
    async = require('async');

program
  .version('0.0.1')
  .option('-y, --days [days]', 'Nb of days to keep', process.env.APP_DAYS_TO_KEEP || 30)
  .option('-d, --debug', 'Debug flag')
  .parse(process.argv);

var after = new Date();

after.addDays(-program.days);

console.log('Cleaning database...');
console.log('Cleaning older entries than %s...', after.toString());

var main = function() {
  async.waterfall(
    [
      function(callback) {
        // Get all users
        User.getAll(callback);
      },
      function(uids, callback) {
        var cleanUserTimelines = function(uid, next) {
          console.log('Cleaning timelines of %s.', uid);
          User.cleanTimelines(uid, after, next);
        }
        async.each(uids, cleanUserTimelines, callback);
      },
      function(callback) {
        console.log('All timelines cleaned. Now deleting old articles...');
        // Get all feeds
        Feed.getAll(callback);
      },
      function(fids, callback) {
        var deleteArticlesFromFeed = function(fid, next) {
          console.log('Delete old entries of feed %s.', fid);
          Timeline.deleteArticlesAfter(fid + ':articles', after, next);
        }
        async.each(fids, deleteArticlesFromFeed, callback);
      },
      function() {
        console.log('Old articles deleted.');
        console.log('Database cleaned.');
        db.quit();
      }
    ],
    function(err) {
      console.error('Error: %s', err);
      db.quit();
    }
  );
};

db.on('connect', main);
