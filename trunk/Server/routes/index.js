/*
 * Router
 *
 * Routes all URLs to a specific controller.
 * The router can differentiate between GET, POST and all the other REST methods.
 */

module.exports = function(app) {
	//view counter
	app.get('/hello.txt', function(req, res) {
		var sess = req.session;
		if(sess.views) {
			sess.views++;
			res.send('Views: '+sess.views);
			res.cookie('bla',sess.views, {signed: true});
		} else {
			sess.views = 1;
			res.send('Welcome to the view counter. Refresh!');
		}
	});

	//URL with parameter
	app.get('/group/:groupId', function(req, res) {
		res.send('Group: '+req.params.groupId);
	});
};