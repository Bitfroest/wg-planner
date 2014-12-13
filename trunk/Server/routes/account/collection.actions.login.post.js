
var validators = require('./validators.js');
var errors = require('../api-errors');
var passwordHelper = require('../password.js');

/*
 * Router for logging in a person.
 *
 * Parameter:
 * - email string: mail address of the person
 * - password string: unencrypted password of the person
 * - persistent string: 1 if the session should be persistent
 *
 * Requirements:
 * - there must be a person with the email
 * - the person must have the password (need to hash first!)
 *
 * Return type:
 * {
 *    id : integer
 *    name : string
 *    email : string
 * }
 */
module.exports = function(req, res, opt) {
	
	validators.validateEmail(req);
	validators.validatePassword(req);
	
	var err = req.validationErrors();
	
	if(err) {
		errors.validation(res, err);
		return;
	}
	
	var login = {
		persistent : '1' === req.sanitize('persistent').toString()
	};
	
	validators.sanitizeEmail(req, login);
	validators.sanitizePassword(req, login);	
		
	opt.client.query('SELECT id, password, name FROM person WHERE email = $1', [login.email], function(err, result) {
	
		if(err) {
			errors.query(res, err);
			return;
		}
		
		if(result.rows.length !== 1) {
			errors.entityNotFound(res, 'person');
			return;
		}
		
		var person = {
			id : result.rows[0].id,
			password : result.rows[0].password,
			name : result.rows[0].name,
			email : login.email
		};
		
		passwordHelper.checkPassword(login.password, person.password, function(err, pwMatch) {
			if(err) {
				errors.custom(res,{
					error: 'password_hash'
				});
				return;
			}
			
			if(!pwMatch) {
				errors.custom(res,{
					error: 'password_check'
				});
				return;
			}
			
			if(login.persistent) {
				req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 14; // set expire time 2 weeks in future
			}
			req.session.personId = person.id;
			req.session.loggedIn = true;
			
			res.json({
				result : {
					id: person.id,
					name: person.name,
					email: person.email
				}
			});
		});
	});
};

