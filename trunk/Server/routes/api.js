module.exports = function() {
	var router = new require('express').Router();

	// API collections to load
	var collections = [
		//'sample',
		'general',
		'notification',
		'account'
	];

	// show API options
	router.options('/', function(req, res) {
		res.json({
			version : 1,
			collections : collections
		});
	});

	// register all collections
	collections.forEach(function(coll) {
		router.use('/' + coll, require('./' + coll + '/index.js')());
	});

	return router;
};
