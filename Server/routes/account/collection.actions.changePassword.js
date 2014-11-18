
var passwordHelper = require('../password.js');
var validators = require('./validators.js');
var errors = require('../api-errors');

/*
 * Router for changing a person's password.
 *
 * Parameter:
 * - password_old string: current password of the person
 * - password string: new password for the person
 * - password_confirm string: confirmed new password for the person
 *
 * Requirements:
 * - loggedIn
 * - password_old must be the current password of the person
 * - password and password_confirm must be the same
 * 
 * Errors:
 * - password_not_confirmed: confirmed password is not equals the password
 */
module.exports = function(req, res) {
	if(! req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}

	req.checkBody('password_old').isLength(6, 40);
	validators.validatePassword(req);

	var err = req.validationErrors();

	if(err) {
		errors.validation(res, err);
		return;
	}

	var form = {
		password_old : req.sanitize('password_old').toString(),
		password : req.sanitize('password').toString(),
		password_confirm : req.sanitize('password_confirm').toString()
	};

	if(form.password !== form.password_confirm) {
		errors.custom(res,{
			error: 'password_confirm'
		});
		return;
	}

	req.getDb(function(err, client, done) {
		if(err) {
			errors.db(res, err);
			return;
		}

		client.query('SELECT password FROM person WHERE id=$1', [req.session.personId], function(err, result) {
			if(err) {
				done();						
				errors.query(res, err);
				return;
			}

			if(result.rows.length !== 1) {
				done();
				errors.entityNotFound(res, 'person');
				return;
			}

			var savedPassword = result.rows[0].password;

			passwordHelper.checkPassword(form.password_old, savedPassword, function(err, pwMatch) {
				if(err) {
					done();
					errors.custom(res,{
						error: 'password_check'
					});
					return;
				}
	
				if(!pwMatch) {
					done();
					errors.custom(res,{
						error: 'password_wrong'
					});
					return;
				}
	
				passwordHelper.hashPassword(form.password, function(err, key) {
					if(err) {
						done();
						errors.custom(res,{
							error: 'password_hash'
						});
						return;
					}
		
					client.query('UPDATE person SET password=$1 WHERE id=$2', [key, req.session.personId], function(err, result) {
						done();
			
						if(err) {
							errors.query(res, err);
							return;
						}
			
						res.json({
							success : true
						});
					});
				});
			});
		});
	});
};

