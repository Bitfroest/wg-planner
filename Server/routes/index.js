/*
 * Router
 *
 * Routes all URLs to a specific controller.
 * The router can differentiate between GET, POST and all the other REST methods.
 */
 
var publicRouter = require('./public');

module.exports = function(app) {
	//view counter
	app.get('/hello.txt', publicRouter.hello);

	//URL with parameter
	app.get('/group/:groupId', publicRouter.group);
};