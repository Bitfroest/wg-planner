
var errors = require('../api-errors');

/*
 * API function that marks a single notification
 * as read ('read' in past tens).
 *
 * Requirements:
 * - loggedIn
 * - notication item with given id must exist
 *
 * Parameter:
 * - url parameter id : integer
 *
 * Return type:
 * {
 *    success : true
 * }
 */

module.exports = function(req, res) {
	if(! req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	
	req.checkParams('id').isInt();
	
	var err = req.validationErrors();
	
	if(err) {
		errors.validation(res, err);
		return;
	}
	
	var form = {
		id : req.sanitize('id').toInt()
	};
	
	req.getDb(function(err, client, done) {
		if(err) {
			errors.db(res, err);
			return;
		}
		
		client.query(
			'UPDATE notification SET read=$1 WHERE notification_data_id=$2 AND recipient_person_id=$3',
			[true, form.id, req.session.personId], function(err, result) {
			
			done();
			
			if(err) {
				errors.query(res, err);
				return;
			}
			
			if(result.rowCount !== 1) {
				errors.entityNotFound(res, err);
				return;
			}
			
			res.json({
				success : true
			});
		});
	});
};
