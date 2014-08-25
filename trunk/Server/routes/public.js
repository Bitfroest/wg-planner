/*
 * Router for public available pages. 
 */

var passwordHelper = require('./password.js');

function validateEmail(req) {
	req.checkBody('email').isLength(5, 60).isEmail();
}

function sanitizeEmail(req, form) {
	form.email = req.sanitize('email').toString();
}

function validatePassword(req) {
	req.checkBody('password').isLength(6, 40);
}

function sanitizePassword(req, form) {
	form.password = req.sanitize('password').toString();
}

function validateName(req) {
	req.checkBody('name', 'Name muss zwischen 3 und 20 Zeichen lang sein.').isLength(3, 20);
	req.checkBody('name', 'Name darf nur Buchstaben, Zahlen, Punkte, Binde- und Unterstriche enthalten.').matches(/^[a-zA-Z][a-zA-Z0-9 \.\-_]*$/);
}

function sanitizeName(req, form) {
	form.name = req.sanitize('name').toString();
}

exports.index = function(req, res) {
	res.render('home', {_csrf: req.csrfToken()});
};
 
exports.login = function(req, res) {
	res.render('login', {
		title : 'Anmelden',
		doNotShowNavbarLogin : true,
		_csrf: req.csrfToken()
	});
};

/*
 * Router for logging in a person.
 *
 * Parameter:
 * - email string: mail address of the person
 * - password string: unencrypted password of the person
 *
 * Requirements:
 * - there must be a person with the email
 * - the person must have the password (need to hash first!)
 */
exports.doLogin = function(req, res) {
	
	validateEmail(req);
	validatePassword(req);
	
	var errors = req.validationErrors();
	
	if(errors) {
		res.redirect('/login?error=true');
		return;
	}
	
	var login = {
		persistent : '1' === req.sanitize('persistent').toString()
	};
	sanitizeEmail(req, login);
	sanitizePassword(req, login);
	
	req.getDb(function(err, client, done) {
		if(err) {
			console.error('Failed to connect in doRegister', err),
			res.redirect('/login?error=internal')
			return;
		}
		
		client.query('SELECT id, password FROM person WHERE email = $1', [login.email], function(err, result){
			done();
			
			if(err) {
				console.error('Failed to load person by person', err);
				res.redirect('/login?error=internal');
				return;
			}
			
			if(result.rows.length == 0) {
				res.redirect('/login?error=user_not_found');
				return;
			}
			
			var person = {
				id : result.rows[0].id,
				password : result.rows[0].password
			};
			
			passwordHelper.checkPassword(login.password, person.password, function(err, pwMatch) {
				if(err) {
					console.error('Failed to checkPassword', err);
					res.redirect('/login?error=internal');
					return;
				}
				
				if(!pwMatch) {
					res.redirect('/login?error=wrong_password');
					return;
				}
				
				if(login.persistent) {
					req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 14; // set expire time 2 weeks in future
				}
				req.session.personId = person.id;
				req.session.loggedIn = true;
				res.redirect('/dashboard');
			});
		});
	});
};

/*
 * Router for logging out a person.
 *
 * Parameter: none.
 *
 * Requirements:
 * - loggedIn
 */
exports.logout = function(req, res) {
	req.session.loggedIn = false;
	res.render('logout');
};

exports.sidWrong = function(req, res) {
	res.render('sid-wrong');
};

exports.register = function(req, res) {
	console.info(req.session.errors);
	
	var errors = req.session.errors;
	req.session.errors = null;
	
	res.render('register', {title : 'Registrieren', errors : errors, _csrf: req.csrfToken()});
};

/*
 * Router for registering a new person.
 *
 * Parameter:
 * - name string: name of the person
 * - email string: mail address of the person
 * - password string: password of the person
 *
 * Requirements: none.
 */
exports.doRegister = function(req, res) {
	// creates a new user/person or fails if any data is not given
	
	validateName(req);
	validateEmail(req);
	validatePassword(req);
	
	var errors = req.validationErrors();
	
	if(errors) {
		req.session.errors = errors;
		res.redirect('/register');
		return;
	}
	
	var person = {};
	sanitizeName(req, person);
	sanitizeEmail(req, person);
	sanitizePassword(req, person);

	passwordHelper.hashPassword(person.password, function(err, key) {
		if(err) {
			console.error('Failed to hash password', err);
			res.redirect('/register?error=internal');
			return;
		}
		
		req.getDb(function(err, client, done) {
			if(err) {
				console.error('Failed to connect in doRegister', err);
				res.redirect('/register?error=internal');
				return;
			}
		
			// insert new person into database
			client.query('INSERT INTO person(name,email,password,role,created) VALUES($1,$2,$3,$4,$5)',
				[person.name, person.email, key, 'customer', new Date()], function(err, result){
			
				done();
				
				if(err) {
					console.error('Failed to insert person', err);
					res.redirect('/register?error=internal');
				} else {
					res.redirect('register?success=true');
				}
			});
		});
	});
};

/*
 * Router for updating a person's data.
 *
 * Parameter:
 * - name string: new name for the person
 *
 * Requirements:
 * - loggedIn
 */
exports.personUpdate = function(req, res) {
	if(req.session.loggedIn) {
		validateName(req);
		
		var errors = req.validationErrors();
		
		if(errors) {
			res.redirect('/internal_error?validation_error');
			return;
		}
		
		var form = {};
		sanitizeName(req, form);
		
		req.getDb(function(err, client, done) {
			if(err) {
				console.error('Failed to connect in personUpdate', err);
				res.redirect('/register?error=internal');
				return;
			}
			
			client.query('UPDATE person SET name=$1 WHERE id=$2', [form.name, req.session.personId], function(err, result) {
				done();
				
				if(err) {
					console.error('Failed to update person', err);
					return;
				}
			
				if(result.rowCount !== 1) {
					console.error('Did not update any row in personUpdate');
				}
				
				res.redirect('/dashboard');
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};

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
exports.personPasswordChange = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('password_old').isLength(6, 40);
		validatePassword(req);
		
		var errors = req.validationErrors();
		
		if(errors) {
			res.redirect('/dashboard?errors');
			return;
		}
		
		var form = {
			password_old : req.sanitize('password_old').toString(),
			password : req.sanitize('password').toString(),
			password_confirm : req.sanitize('password_confirm').toString()
		};
		
		if(form.password !== form.password_confirm) {
			res.redirect('/dashboard?error=not_confirmed');
			return;
		}
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in personPasswordChange', err);
			}
			
			client.query('SELECT password FROM person WHERE id=$1', [req.session.personId], function(err, result) {
				if(err) {
					return console.error('Failed to load password of person', err);
				}
				
				if(result.rows.length !== 1) {
					return console.error('Did not find person ' +req.session.personId);
				}
				
				var savedPassword = result.rows[0].password;
				
				passwordHelper.checkPassword(form.password_old, savedPassword, function(err, pwMatch) {
					if(err) {
						return console.error('Error during password check', err);
					}
					
					if(!pwMatch) {
						res.redirect('/dashboard?password_wrong');
						return;
					}
					
					passwordHelper.hashPassword(form.password, function(err, key) {
						if(err) {
							return console.error('Could not hash new password', err);
						}
						
						client.query('UPDATE person SET password=$1 WHERE id=$2', [key, req.session.personId], function(err, result) {
							done();
							
							if(err) {
								return console.error('Failed to update new password', err);
							}
							
							res.redirect('/dashboard?password_change=success');
						});
					});
				});
			});
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
}

exports.imprint = function(req, res) {
	res.render('imprint', {title : 'Impressum', _csrf: req.csrfToken()});
};