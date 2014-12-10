/*
 * Router for displaying the customer settings.
 *
 * Parameter: none
 *
 * Requirements:
 * - loggedIn
 */
exports.settings = function(req, res) {
	if(! req.session.loggedIn) {
		res.redirect('/sid_wrong');
		return;
	}
	
	res.render('settings', {
		_csrf: req.csrfToken(),
		title: 'Einstellungen',
		breadcrumbs : [{url: '/settings' , text: 'Einstellungen'}]
	});
};