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
        context.user.configuration = JSON.parse(req.user.configuration);
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

    res.render('welcome', context);
  });

};
