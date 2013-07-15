#!/usr/bin/env node

/**
 * Module dependencies.
 */
var program = require('commander'),
    fs = require('fs'),
    crypto = require('crypto'),
    async = require('async'),
    JSONStream = require('JSONStream'),
    db = require('../lib/db'),
    logger = require('../lib/logger'),
    Timeline = require('../lib/timeline');
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

logger.info('Import Google Reader Starred file: %s for %s ...', file, uid);

var exit = function(err, info) {
  if (err) {
    logger.error(err);
  } else if (info) {
    logger.info(info);
  }
  setTimeout(function(){
    db.quit();
  }, 3000);
};

var parser = JSONStream.parse('items.*');

parser.on('end', function() {
  exit(null, 'Import done.');
});

parser.on('data', function(data) {
  try {
    var article = {
      title: data.title,
      description: data.content ? data.content.content : data.summary.content,
      author: data.author,
      date: data.updated * 1000,
      pubdate: data.published * 1000,
      link: data.canonical ? data.canonical[0].href : data.alternate[0].href,
      meta: {
        link: data.origin.htmlUrl,
        title: data.origin.title,
        xmlurl: data.origin.streamId.substring(5)
      }
    };
    for (var attr in article) {
      if (article[attr] == undefined && attr !== 'author') {
        logger.warn('Attribute %s is null or undefined', attr, article.title);
      }
    }
    var hash = crypto.createHash('md5').update(article.meta.xmlurl).digest("hex");
    article.id = user.uid + ':feed:' + hash;
    hash = crypto.createHash('md5').update(article.link).digest("hex");
    article.id = article.id + ':' + hash;
    logger.debug('Saving %s (%s) ...', article.id, article.link);
    async.waterfall(
      [
        function(callback) {
          // Save article
          db.set(article.id, JSON.stringify(article), callback);
        },
        function(reply, callback) {
          // Add article to arhive timeline
          var key = User.getTimelineKey(uid, 'archive');
          Timeline.addArticle(key, article, callback);
        },
        function(callback) {
          logger.debug('Article %s saved in user\'s archive timeline.', article.id);
        }
      ],
      function(err) {
        throw err;
      }
    );
  }
  catch (err) {
    logger.error('ERROR: %s (%s)', data.title, err);
  }
});

db.on('connect', function() {
  async.waterfall(
    [
      function(callback) {
        User.exists(uid, callback);
      },
      function(exists, callback) {
        if (!exists) {
          return callback('ERROR: USER NOT FOUND');
        }
        User.find(uid, callback);
      },
      function(u, callback) {
        user = u;
        fs.createReadStream(file, {'bufferSize': 4 * 1024}).pipe(parser);
      }
    ],
    function(err) {
      exit(err);
    }
  );
});

