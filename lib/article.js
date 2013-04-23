var db = require('./db');

var Article = module.exports = function() {};

Article.get = function(aid, done) {
  db.get(aid, function(err, article) {
    if (err) return done(err);
    article = JSON.parse(article);
    article.id = aid;
    done(null, article);
  });
}

