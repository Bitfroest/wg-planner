var errors = require('./api-errors');

module.exports = function() {
	return require('./api-helper')({
		'/' : {
			get : function(req, res) {
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
			}
		},
		'/:id/actions/read' : {
			post : function(req, res) {
				if(! req.session.loggedIn) {
					errors.loggedIn(res);
					return;
				}
				
				req.getDb(function(err, client, done) {
					if(err) {
						errors.db(res, err);
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
					
					client.query(
						'UPDATE notification SET read=$1 WHERE notification_data_id=$2 AND recipient_person_id=$3',
						[true, form.id, req.session.personId], function(err, result) {
						
						done();
						
						if(err) {
							errors.query(res, err);
							return;
						}
						
						res.json({
							success : (result.rowCount === 1)
						});
					});
				});
			}
		}
	});
};
