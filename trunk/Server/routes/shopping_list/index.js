module.exports = function() {
	return require('../api-helper')({
		'/actions/shop_search' : {
			get : require('./collection.action.shopsearch.js')
		} 
	}, {autoDb : true});
};
