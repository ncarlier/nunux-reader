module.exports = function(app){
  /**
   * Index page.
   */
  app.get('/', function(req, res) {
    var context = {
      info: app.get('info'),
      realm: app.get('realm')
    };

    res.format({
      html: function() {
        context.gaId = process.env.APP_GA_ID || 'UA-41864622-1';
        context.gaDomain = process.env.APP_GA_DOMAIN || 'nunux.org';
        if (req.user) {
          context.uid = req.user.uid;
          res.render('index', context);
        } else {
          res.render('home', context);
        }
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
};
