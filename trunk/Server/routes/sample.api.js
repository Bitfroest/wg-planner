module.exports = function() {
	var router = new require('express').Router();
	
	var resources = ['bla'];
	
	router.get('/', function(req, res) {
		res.json(resources);
	});
	
	router.post('/', function(req, res) {
		resources.push(req.json);
		res.json({
			id : resources.length - 1
		});
	});
	
	router.get('/:id', function(req, res) {
		res.json(resources[req.params.id]);
	});

	return router;
};
