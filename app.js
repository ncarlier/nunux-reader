/**

  NUNUX Reader

  Copyright (c) 2013 Nicolas CARLIER (https://github.com/ncarlier)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
  odule dependencies.
*/

var express = require('express'),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google').Strategy,
    BrowserIDStrategy = require('passport-browserid').Strategy,
    logger = require('./lib/logger'),
    User = require('./lib/user');

var app = module.exports = express();

app.configure(function(){
  app.set('port', process.env.APP_PORT || 3000);
  app.set('realm', process.env.APP_REALM || 'http://localhost:' + app.get('port'));
  app.set('pshb', process.env.APP_PSHB_ENABLED === 'true');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.cookieSession({secret: 'NuNUXReAdR_'}));
  app.use(express.bodyParser());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function() {
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(errorHandler);
  logger.setLevel('debug');
});

app.configure('production', function() {
  app.use(express.static(path.join(__dirname, 'public-build')));
  app.use(errorHandler);
  logger.setLevel('info');
});

function errorHandler(err, req, res, next) {
  if ('test' != app.get('env')) logger.error(err.stack || err);
  res.status(err.status || 500);
  res.format({
    html: function(){
      res.render('error', {error: err});
    },
    text: function(){
      res.type('txt').send('error: ' + err + '\n');
    },
    json: function(){
      res.json({error: err});
    }
  });
}

passport.serializeUser(function(user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function(id, done) {
  User.find(id, done);
});

passport.use(new GoogleStrategy({
    returnURL: app.get('realm') + '/auth/google/return',
    realm: app.get('realm') + '/'
  },
  function(identifier, profile, done) {
    var user = {
      uid: profile.emails[0].value,
      username: profile.displayName,
      identifier: identifier
    };
    User.login(user, done);
  })
);

passport.use(new BrowserIDStrategy({
    audience: app.get('realm')
  },
  function(email, done) {
    var user = {
      uid: email,
      username: email
    };
    User.login(user, done);
  }
));

app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return',
        passport.authenticate('google', {
          successRedirect: '/',
          failureRedirect: '/' }));

app.post('/auth/browserid',
         passport.authenticate('browserid', {
           successRedirect: '/',
           failureRedirect: '/' }));

app.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(403);
};

// Register routes...
require('./routes/index')(app);
require('./routes/timeline')(app);
require('./routes/subscription')(app);
require('./routes/pubsubhubbud')(app);

http.createServer(app).listen(app.get('port'), function() {
  logger.info('Express server listening on port %s (%s mode)', app.get('port'), app.get('env'));
});
