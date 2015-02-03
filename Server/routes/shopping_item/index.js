module.exports = function() {
	return require('../api-helper')({
		'/' : {
			get : require('./collection.get.js'),
			post : require('./collection.post.js')
		},
		'/:id' : {
			delete : require('./resource.delete.js')
		},
	}, {autoDb : true});
};
