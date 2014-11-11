var errors = require('./api-errors');
var passwordHelper = require('./password.js');

function validateName(req) {
	req.checkBody('name', 'Name muss zwischen 3 und 20 Zeichen lang sein.').isLength(3, 20);
	req.checkBody('name', 'Name darf nur Buchstaben, Zahlen, Punkte, Binde- und Unterstriche enthalten.').matches(/^[a-zA-Z][a-zA-Z0-9 \.\-_]*$/);
}

function sanitizeName(req, form) {
	form.name = req.sanitize('name').toString();
}

function validatePassword(req) {
	req.checkBody('password').isLength(6, 40);
}

module.exports = function(req, res) {
	return require('./api-helper')({
		'/' : {
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
			},
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
			put : function(req, res) {
				if(! req.session.loggedIn) {
					errors.loggedIn(res);
					return;
				}
				
				validateName(req);
		
				var errors = req.validationErrors();
		
				if(errors) {
					errors.validation(res, errors);
					return;
				}
		
				var form = {};
				sanitizeName(req, form);
		
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
			}
		},
		'/actions/change_password' : {
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
			 */
			post : function(req, res) {
				if(! req.session.loggedIn) {
					errors.loggedIn(res);
					return;
				}
	
				req.checkBody('password_old').isLength(6, 40);
				validatePassword(req);
	
				var errors = req.validationErrors();
	
				if(errors) {
					errors.validation(res, errors);
					return;
				}
	
				var form = {
					password_old : req.sanitize('password_old').toString(),
					password : req.sanitize('password').toString(),
					password_confirm : req.sanitize('password_confirm').toString()
				};
	
				if(form.password !== form.password_confirm) {
					// TODO custom error
					res.redirect('/dashboard?error=not_confirmed');
					return;
				}
	
				req.getDb(function(err, client, done) {
					if(err) {
						errors.db(res, err);
						return;
					}
		
					client.query('SELECT password FROM person WHERE id=$1', [req.session.personId], function(err, result) {
						if(err) {
							errors.query(res, err);
							return;
						}
			
						if(result.rows.length !== 1) {
							return console.error('Did not find person ' +req.session.personId);
						}
			
						var savedPassword = result.rows[0].password;
			
						passwordHelper.checkPassword(form.password_old, savedPassword, function(err, pwMatch) {
							if(err) {
								// TODO custom error
								return console.error('Error during password check', err);
							}
				
							if(!pwMatch) {
								//TODO custom error
								res.redirect('/dashboard?password_wrong');
								return;
							}
				
							passwordHelper.hashPassword(form.password, function(err, key) {
								if(err) {
									// TODO custom error
									return console.error('Could not hash new password', err);
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
			}
		}
	});
};
