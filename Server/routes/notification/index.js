var errors = require('../api-errors');

module.exports = function() {
	return require('../api-helper')({
		'/' : {
			get : require('./collection.get.js')
		},
		'/:id/actions/read' : {
			post : require('./resource.actions.read.js')
		}
	});
};

