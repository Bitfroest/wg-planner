module.exports = function() {
	return require('../api-helper')({
		'/' : {
			get : require('./collection.get.js')
		} 
	}, {autoDb : true});
};
