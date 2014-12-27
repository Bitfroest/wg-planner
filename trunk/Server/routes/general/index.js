
/*
 * API for general things like CSRF token or api information.
 */

module.exports = function() {
	return require('../api-helper')({
		'/csrf' : {
			get : require('./csrf.js')
		}
	}, {
		autoDb : false
	});
};

