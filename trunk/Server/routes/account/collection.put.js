
var validators = require('./validators.js');
var errors = require('../api-errors');

/*
 * API function for updating a person's data.
 *
 * Parameter:
 * - name string: new name for the person
 *
 * Requirements:
 * - loggedIn
 *
 * Return type
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

	validators.validateName(req);

	var err = req.validationErrors();

	if(err) {
		errors.validation(res, err);
		return;
	}

	var form = {};
	validators.sanitizeName(req, form);

	req.getDb(function(err, client, done) {
		if(err) {
			errors.db(res, err);
			return;
		}

		client.query('UPDATE person SET name=$1 WHERE id=$2 RETURNING id, name, email, role',
			[form.name, req.session.personId], function(err, result) {
		
			done();

			if(err) {
				errors.query(res, err);
				return;
			}

			if(result.rowCount !== 1) {
				errors.entityNotFound(res, 'person');
				return;
			}

			res.json({
				result: result.rows[0]
			});
		});
	});
};

