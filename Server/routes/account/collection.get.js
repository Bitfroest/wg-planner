
var errors = require('../api-errors');

/*
 * API function that returns current account information
 *
 * Requirements:
 * - loggedIn
 *
 * Return type:
 * {
 *    id : integer
 *    name : string
 *    email : string
 *    role : string
 * }
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

		client.query('SELECT id, name, email, role FROM person WHERE id=$1',
			[req.session.personId], function(err, result) {
			
			done();

			if(err) {
				errors.query(res, err);
				return;
			}

			if(result.rows.length !== 1) {
				errors.entityNotFound(res, 'person');
				return;
			}
			
			res.json({
				result : result.rows[0]
			});
		}); 
	});
};

