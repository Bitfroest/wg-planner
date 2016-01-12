module.exports = function() {
	return require('../api-helper')({
		'/actions/shop_search' : {
			get : require('./collection.action.shopsearch.js')
		},
		'/actions/receipt_status' : {
			get : require('./collection.action.receiptstatus.js')
		}
	}, {autoDb : true});
};
