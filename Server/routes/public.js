/*
 * Router for public available pages. 
 */

var passwordHelper = require('./password.js');

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

exports.doLogin = function(req, res) {
	
	req.checkBody('email').isLength(1, 60).isEmail();
	req.checkBody('password').isLength(6, 40);
	
	var errors = req.validationErrors();
	
	if(errors) {
		res.redirect('/login?error=true');
		return;
	}
	
	var login = {
		email : req.sanitize('email').toString(),
		password : req.sanitize('password').toString(),
		persistent : '1' === req.sanitize('persistent').toString()
	};
	
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

exports.doRegister = function(req, res) {
	// creates a new user/person or fails if any data is not given
	
	req.checkBody('user', 'Name muss zwischen 3 und 20 Zeichen lang sein.').len(3, 20);
	req.checkBody('user', 'Name darf nur Buchstaben, Zahlen, Punkte, Binde- und Unterstriche enthalten.').matches(/^[a-zA-Z][a-zA-Z0-9 \.\-_]*$/);
	req.checkBody('email', 'E-Mail-Adresse muss ein gültiges Format haben.').len(3, 40).isEmail();
	req.checkBody('password', 'Passwort muss zwischen 6 und 40 Zeichen lang sein.').len(6, 40);
	
	var errors = req.validationErrors();
	
	if(errors) {
		req.session.errors = errors;
		res.redirect('/register');
		return;
	}
	
	var person = {
		name : req.sanitize('user').toString(),
		email : req.sanitize('email').toString(),
		password : req.sanitize('password').toString()
	};

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

exports.personUpdate = function(req, res) {
	// creates a new user/person or fails if any data is not given
	
	req.checkBody('name', 'Name muss zwischen 3 und 20 Zeichen lang sein.').len(3, 20);
	req.checkBody('name', 'Name darf nur Buchstaben, Zahlen, Punkte, Binde- und Unterstriche enthalten.').matches(/^[a-zA-Z][a-zA-Z0-9 \.\-_]*$/);
	
	var errors = req.validationErrors();
	
	if(errors) {
		res.redirect('/internal_error?validation_error');
		return;
	}
	
	var form = {
		name : req.sanitize('name').toString()
	};
	
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
};

exports.imprint = function(req, res) {
	res.render('imprint', {title : 'Impressum', _csrf: req.csrfToken()});
};