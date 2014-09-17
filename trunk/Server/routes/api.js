module.exports = function() {
	var router = new require('express').Router();

	var collections = [
		'sample'
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
		router.use('/' + coll, require('./' + coll + '.api.js')());
	});

	return router;
};
