var db = require('./db');

var Article = module.exports = function() {};

/**
 * Get aa article.
 * @param {String}   aid  Article ID.
 * @param {Function} done Callback with article in params.
 */
Article.get = function(aid, done) {
  db.get(aid, function(err, article) {
    if (err) return done(err);
    article = JSON.parse(article);
    article.id = aid;
    done(null, article);
  });
}

