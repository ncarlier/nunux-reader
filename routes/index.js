module.exports = function(app){
  /**
   * Index page.
   */
  app.get('/', function(req, res) {
    if (!req.user) {
      return res.redirect('/welcome');
    }

    var context = {
      info: app.get('info'),
      realm: app.get('realm'),
      env: app.get('env')
    };

    res.format({
      html: function() {
        context.user = req.user;
        res.render('index', context);
      },
      text: function() {
        res.type('txt').send(
          'name: ' + context.name + '\n' +
          'description: ' + context.description + '\n' +
          'version: ' + context.version + '\n'
        );
      },
      json: function() {
        res.json(context);
      }
    });
  });

  /**
   * Welcome page.
   */
  app.get('/welcome', function(req, res) {
    var context = {
      info: app.get('info'),
      realm: app.get('realm'),
      env: app.get('env')
    };

    context.gaId = process.env.APP_GA_ID || 'UA-41864622-1';
    context.gaDomain = process.env.APP_GA_DOMAIN || 'nunux.org';
    res.render('welcome', context);
  });

};
