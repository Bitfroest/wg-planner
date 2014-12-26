var logger = require('../utils/log.js');
var errors = require('./api-errors');

var _forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);

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
module.exports = function(routingTable, options) {
	var router = new require('express').Router();

	_forEach(Object.keys(routingTable), function(route) {
		var methods = routingTable[route];
		
		_forEach(Object.keys(methods), function(method) {
			var func = methods[method];
			
			if(options && options.autoDb) {
				// special call with automatic client
				router[method](route, function (req, res) {
				
					// get database client
					req.getDb(function(err, client, done) {
						if(err) {
							errors.db(res, err);
							return;
						}
						
						logger.info('create client for ' + route + ':' + method);
						
						// overwrite res.end() for auto done()
						var _end = res.end;
						res.end = function() {
							logger.info('done client for '+ route + ':' + method);
						
							done(); // call done
							_end.apply(res, arguments); // call original function
						};
						
						func(req, res, {
							client : client,
							done : done // only for manual cases
						});
					});
				});
				
			} else {
				// usual direct call
				router[method](route, func);
			}
		});
		
		if(methods.options === undefined) {
			router.options(route, function(req, res) {
				res.json({
					methods : Object.keys(methods)
				});
			});
		}
	});
	
	return router;
};
