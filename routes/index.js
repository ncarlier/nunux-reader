var globalAppInfo = require('../package.json');

module.exports = function(app){
	/**
	 * Index page.
	 */
	app.get('/', function(req, res) {
		var info = {
			name: globalAppInfo.name,
			description: globalAppInfo.description,
			version: globalAppInfo.version
		};

		res.format({
			html: function(){
        res.render('index', info);
			},
			text: function(){
				res.type('txt').send(
					'name: ' + info.name + '\n' +
					'description: ' + info.description + '\n' +
					'version: ' + info.version + '\n'
				);
			},
			json: function(){
				res.json(info);
			}
		})
	});
};
