
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , GoogleStrategy = require('passport-google').Strategy
  , User = require('./lib/user');

var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.APP_PORT || 3000);
  app.set('realm', process.env.APP_REALM || 'http://localhost');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


passport.use(new GoogleStrategy({
    returnURL: app.get('realm') + ':' + app.get('port') + '/auth/google/return',
    realm: app.get('realm')
  },
  function(identifier, profile, done) {
    User.findOrCreate({uid: identifier}, done); 
  })
);

app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
        passport.authenticate('google', {
          successRedirect: '/',
          failureRedirect: '/' }));

app.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(403);
}

// Register routes...
require('./routes/index')(app);
require('./routes/article')(app);
require('./routes/subscription')(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
