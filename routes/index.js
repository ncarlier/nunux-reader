var globalAppInfo = require('../package.json');

module.exports = function(app){
  /**
   * Index page.
   */
  app.get('/', function(req, res) {
    var context = {
      name: globalAppInfo.name,
      description: globalAppInfo.description,
      version: globalAppInfo.version
    };

    res.format({
      html: function(){
        if (req.user) {
          context.uid = req.user.uid;
          res.render('index', context);
        } else {
          res.render('login', context);
        }
      },
      text: function(){
        res.type('txt').send(
          'name: ' + context.name + '\n' +
          'description: ' + context.description + '\n' +
          'version: ' + context.version + '\n'
        );
      },
      json: function(){
        res.json(context);
      }
    })
  });
};
