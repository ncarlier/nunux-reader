module.exports = function(app){
  app.get('/archive', function(req, res) {
     var context = {
      url: req.query.url,
      realm: app.get('realm')
    };
    if (req.user) {
      context.uid = req.user.uid;
      context.message = 'Page saved :)';
    } else {
      context.message = 'User not logged.';
    }

    res.format({
      html: function() {
        res.render('archive', context);
      },
      text: function() {
        res.type('txt').send(
          'url: ' + context.url + '\n' +
          'realm: ' + context.realm + '\n' +
          'message: ' + context.message + '\n'
        );
      },
      json: function() {
        res.json(context);
      }
    });
  });
};
