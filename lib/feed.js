var db = require('./db'),
    logger = require('./logger'),
    crypto = require('crypto'),
    FeedParser = require('feedparser'),
    request = require('request'),
    querystring = require('querystring'),
    urlParse = require('url').parse,
    Article = require('./article'),
    async = require('async');

var Feed = module.exports = function() {};

var isValidUrl = function(url) {
  return (/((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).test(url);
};

/**
 * Get true Feed key.
 * @param {String} key generic key
 * @return {String}    Returns feed key or null if not found
 */
Feed.assertKey = function(key) {
  if (!key) return null;
  var fid = key.match(/(feed:\w+)/gm);
  return fid ? fid[0] : null;
};

/**
 * Get feed storage key.
 * @param {String} url Feed URL.
 * @return {String}    Returns the key
 */
Feed.getKey = function(url) {
  var hash = crypto.createHash('md5').update(url).digest("hex");
  return 'feed:' + hash;
};

/**
 * Get feed's subscribers storage key.
 * @param {String} fid Feed ID.
 * @return {String}    Returns the key
 */
Feed.getSubscribersKey = function(fid) {
  return fid + ':subscribers';
};

/**
 * Get feed's articles storage key.
 * @param {String} fid Feed ID.
 * @return {String}    Returns the key
 */
Feed.getArticlesKey = function(fid) {
  return fid + ':articles';
};

/**
 * Test if a feed exists.
 * @param {Object}   fid  Feed ID.
 * @param {Function} done Callback with exists status in params.
 */
Feed.exists = function(fid, done) {
  fid = Feed.assertKey(fid);
  if (!fid) return done('Bad Feed key: ' + fid);
  db.exists(fid, done);
};

/**
 * Find or create a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
Feed.findOrCreate = function(feed, done) {
  var fid = Feed.getKey(feed.xmlurl);
  async.waterfall(
    [
      function(callback) {
        Feed.exists(fid, callback);
      },
      function(exists) {
        if (exists) {
          Feed.get(fid, done);
        } else {
          Feed.create(feed, done);
        }
      }
    ],
    function(err) {
      logger.error('Error will Feed.findOrCreate: %s', err);
      done(err);
    }
  );
};

/**
 * Get a feed.
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback with feed in params.
 */
Feed.get = function(fid, done) {
  fid = Feed.assertKey(fid);
  if (!fid) return done('Bad Feed key: ' + fid);
  db.hgetall(fid, function(err, feed) {
    if (err || feed === null) return done(err || 'Feed ' + fid + ' not found.');
    feed.id = fid;
    done(null, feed);
  });
};

/**
 * Get a feed by URL.
 * @param {String}   url  Feed URL.
 * @param {Function} done Callback with feed in params.
 */
Feed.getByUrl = function(url, done) {
  var fid = Feed.getKey(url);
  logger.debug('Retrieve feed %s with url %s', fid, url);
  Feed.get(fid, function(err, feed) {
    if (err || feed === null) return done(err || 'Feed ' + url + ' not found.');
    done(null, feed);
  });
};

/**
 * Get all feeds (feed ids).
 * @param {Function} done Callback with fids in params.
 * */
Feed.getAll = function(done) {
  db.lrange('feeds', '0', '-1', done);
};

/**
 * Get feed infos from url.
 * @param {String}   url  Feed URL.
 * @param {Function} done Callback with feed in params.
 */
Feed.getFeedInfos = function(url, done) {
  var req = {
    uri: url,
    proxy: process.env.HTTP_PROXY
  };
  try {
    var r = request(req);
    r.pipe(
      new FeedParser()
      .on('error', done)
      .on('meta', function (meta) {
        done(null, {
          title: meta.title,
          xmlurl: meta.xmlurl || url,
          htmlurl: meta.link,
          hub: meta.cloud ? meta.cloud.href : undefined
        });
      })
    );
    r.on('error', done);
  } catch (e) {
    done(e.message);
  }
};

/**
 * Create a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
Feed.create = function(feed, done) {
  var fid = null;
  logger.debug('Creating feed %s ...', feed.xmlurl);

  async.waterfall(
    [
      function(callback) {
        // if just an url then get feed infos...
        if (!feed.title) {
          Feed.getFeedInfos(feed.xmlurl, callback);
        } else {
          callback(null, {
            title: feed.title,
            description: feed.description,
            xmlurl: feed.xmlurl,
            htmlurl: feed.htmlurl,
            hub: feed.hub
          });
        }
      },
      function(newFeed, callback) {
        fid = Feed.getKey(newFeed.xmlurl);
        for (var i in newFeed) {
          if (newFeed[i] === null || newFeed[i] === undefined) {
            delete newFeed[i];
          }
        }
        db.hmset(fid, newFeed, callback);
      },
      function(reply, callback) {
        db.rpush('feeds', fid, callback);
      },
      function(reply) {
        logger.info('Feed %s created.', fid);
        Feed.get(fid, done);
      }
    ],
    function(err) {
      logger.error('Error will Feed.create: %s', err);
      done(err);
    }
  );
};

/**
 * Update a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with feed in params.
 */
Feed.update = function(feed, data, done) {
  for (var i in data) {
    if (data[i] === null || data[i] === undefined) {
      delete data[i];
    }
  }
  if (!Object.keys(data).length) return done(null, feed);
  // logger.debug('Update feed %s with %j ...', feed.id, data);
  var now = new Date();
  data.updateDate = now.toISOString();
  if (data.status) {
    if (data.status.match(/^error/)) {
      if (feed.errCount && !isNaN(feed.errCount)) {
        errCount = parseInt(feed.errCount, 10) + 1;
      } else {
        errCount = 1;
      }
      data.errCount = errCount.toString();
    } else {
      data.errCount = '0';
    }
  }
  db.hmset(feed.id, data, function(err, reply) {
    for (var x in data) feed[x] = data[x];
    done(err, feed);
  });
};

/**
 * Get feed's subscribers (Users).
 * @param {String}   fid  Feed ID.
 * @param {Function} done Callback with feed's subscribers (uids) in params.
 */
Feed.getSubscribers = function(fid, done) {
  fid = Feed.assertKey(fid);
  if (!fid) return done('Bad Feed key: ' + fid);
  db.smembers(Feed.getSubscribersKey(fid), done);
};

/**
 * Parse feed body and create articles.
 * @param {String}   body Feed body.
 * @param {Function} done Callback with no params.
 */
Feed.parse = function(body, feed, done) {
  var meta, articles;
  async.waterfall(
    [
      function(callback) {
        // Parse XML
        FeedParser.parseString(body, callback);
      },
      function(_meta, _articles, callback) {
        meta = _meta;
        articles = _articles;
        if (feed) callback(null, feed);
        else {
          // Retrieve Feed in DB
          Feed.getByUrl(meta.xmlurl, callback);
        }
      },
      function(_feed, callback) {
        feed = _feed;
        // Update feed meta if needed...
        var obj = {};
        if (meta.title && feed.title !== meta.title) obj.title = meta.title;
        if (meta.description && feed.description !== meta.description) obj.description = meta.description;
        if (meta.link && feed.link !== meta.link) obj.link = meta.link;
        if (meta.cloud && meta.cloud.href !== feed.hub) obj.hub = meta.cloud.href;
        Feed.update(feed, obj, callback);
      },
      function(_feed, callback) {
        feed = _feed;
        var createArticle = function(article, next) {
          Article.create(article, feed, function(err, a) {
            if (err) {
              if (err != 'EEXIST' && err != 'ETOOOLD') {
                logger.warn('Feed %s: Unable to create article: %s', feed.id, err);
                next(err);
              } else next(null);
            } else {
              logger.debug('Feed %s: New article %s : %s', feed.id, a.id, a.title);
              next(null, {aid: a.id});
            }
          });
        };
        // Add articles...
        async.each(articles, createArticle, callback);
      },
      function(aids) {
        logger.debug('Feed %s: %d new article.', feed.id, aids.length);
        if (feed.hub && !feed.pshbEnabled) {
          Feed.subHubBud(feed, done);
        } else {
          done();
        }
      }
    ],
    function(err) {
      logger.error('Error will Feed.parse: %s', err);
      done(err);
    }
  );
};

/**
 * Subscribe to a Hub for update a feed.
 * @param {Object}   feed Feed.
 * @param {Function} done Callback with no params.
 */
Feed.subHubBud = function(feed, done) {
  var hubUri = feed.hub;
  if (!hubUri || process.env.APP_PSHB_ENABLED != 'true') {
    // NOOP if no hub or PSHB is disabled.
    return done(null);
  }
  var port = process.env.APP_PORT || 3000;
  var realm = process.env.APP_REALM || 'http://localhost:' + port;

  var query = {
    'hub.callback':      realm + '/pubsubhubbud/callback',
    'hub.mode':          'subscribe',
    'hub.topic':         feed.xmlurl,
    'hub.verify':        'async',
    'hub.lease_seconds': '', // TODO
    'hub.secret':        '', // TODO
    'hub.verify_token':  ''  // TODO
  };

  hubUri = urlParse(hubUri);
  if (!hubUri.port) {
    hubUri.port = 80;
  }
  if (hubUri.host.indexOf(":") != -1) {
    hubUri.host = hubUri.host.split(":")[0];
  }

  var hubClient = http.createClient(hubUri.port, hubUri.host);

  var path = hubUri.pathname || "";
  if (hubUri.search) {
    path += hubUri.search;
  }

  logger.debug('Contacting PubSubHubBud %s ...', hubUri.href);
  var hubRequest = hubClient.request(
    'POST', path,
    {
      "Host": hubri.host,
      "Accept": "*/*",
      "Content-length": requestBody.length,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  );

  hubRequest.addListener('response', function (response) {
    var body = "";
    response.setBodyEncoding("utf8");
    response.addListener('data', function (chunk) {
      body += chunk;
    });

    response.addListener('end', function() {
      if (response.statusCode == 202) {
        // Accepted means success for an async request, but we need
        // to wait for async verification request now.verification    
        logger.info('PubSubHubBud subscription sended for %s', feed.xmlurl);
        done(null);
      } else if (response.statusCode == 204) {
        // No-Content means success for a sync sub.
        logger.info('PubSubHubBud subscription confirmation received for %s', feed.xmlurl);
        Feed.update(feed, {pshbEnabled: true}, done);
      } else {
        // Any other response code is an error.
        done(body);
      }
    });
  });

  hubRequest.write(querystring.stringify(query));
  hubRequest.close();
};

