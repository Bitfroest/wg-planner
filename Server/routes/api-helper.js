/*
 * Helper function to create RESTful APIs.
 *
 * Takes an object of the form:
 * {
 *  '/' : {
 *   get : function(req, res) {...}
 *   post : function(req, res) {...}
 *  },
 *  '/:id' : {
 *   get : function(req, res) {...}
 *   delete : function(req, res) {...}
 *  }
 *
 * Generates an express router with the given paths and methods.
 * It will also generate an OPTIONS route for every path that exposes
 * the available methods for that path.
 */
module.exports = function(routingTable) {
	var router = new require('express').Router();

	Array.prototype.forEach.call(Object.keys(routingTable), function(route) {
		var methods = routingTable[route];
		
		Array.prototype.forEach.call(Object.keys(methods), function(method) {
			var func = methods[method];
			
			router[method](route, func);
		});
		
		if(!('options' in methods)) {
			router.options(route, function(req, res) {
				res.json({
					methods : Object.keys(methods)
				});
			});
		}
	});
	
	return router;
};
