var async = require('async');

/*
 * Router for displaying the customer settings.
 *
 * Parameter: none
 *
 * Requirements:
 * - loggedIn
 */
exports.settings = function(req, res) {
	if(req.session.loggedIn) {
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in person', err);
			}
			
			async.series({
				person : client.query.bind(client, 'SELECT name, email, role FROM person WHERE id=$1', [req.session.personId]),
			}, function(err, result){
				done();
				
				if(err) {
					return console.error('Failed to load person', err);
				}
				
				res.render('settings', {
					_csrf: req.csrfToken(),
					person : result.person.rows[0],
					title: 'Einstellungen',
					breadcrumbs : [{url: '/settings' , text: 'Einstellungen'}]
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};
