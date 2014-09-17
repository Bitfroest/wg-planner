module.exports = function() {
	var resources = {};
	
	return require('./api-helper')({
		'/' : {
			get : function(req, res) {
				res.json(resources);
			},
			post: function(req, res) {
				var id = Math.round(1000000 * Math.random());
				resources[id] = req.json;
				res.json({
					id : id
				});
			}
		},
		'/:id' : {
			get : function(req, res) {
				res.json(resources[req.params.id]);
			},
			delete : function(req, res) {
				delete resources[req.params.id];
				res.json({
					id : req.params.id
				});
			},
			put : function(req, res) {
				resources[req.params.id] = req.json;
			}
		}
	});
};
