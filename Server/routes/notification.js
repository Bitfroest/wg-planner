exports.notification = function(req, res) {
	if(! req.session.loggedIn) {
		res.render('/sid_wrong');
		return;
	}
	
	res.render('notification', {
		_csrf: req.csrfToken(),
		breadcrumbs : [{url: '/notifications', text: 'Benachrichtigungen'}],
		title : 'Benachrichtigungen'
	});
};
