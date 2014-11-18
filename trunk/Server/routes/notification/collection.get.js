
var errors = require('../api-errors');

/*
 * API function that returns all notifications
 * visible to the current user.
 *
 * Requirements:
 * - loggedIn
 *
 * Return type:
 * [{
 *    id : integer,
 *    created : timestamp,
 *    type : NotificationType,
 *    data : content,
 *    read : boolean
 * }]
 */

module.exports = function(req, res) {
	if(! req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	
	req.getDb(function(err, client, done) {
		if(err) {
			errors.db(res, err);
			return;
		}
		
		client.query(
			'SELECT d.id AS id, d.created AS created, d.type AS type, d.data AS data, n.read AS read ' +  
			'FROM notification n JOIN ' +
			'notification_data d ON (n.notification_data_id = d.id) ' +
			'WHERE n.recipient_person_id = $1 ' +
			'ORDER BY d.created DESC',
			[req.session.personId],
			function(err, result) {
		
			done();
		
			if(err) {
				errors.query(res, err);
				return;
			}
			
			res.json({
				result : result.rows
			});
		});
	});
};

