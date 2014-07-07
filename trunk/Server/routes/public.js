/*
 * Router for public available pages. 
 */

var passwordHelper = require('./password.js');

exports.index = function(req, res) {
	res.render('home');
};
 
exports.login = function(req, res) {
	res.render('login', {title : 'Anmelden'});
};

exports.doLogin = function(req, res) {
	var login = {
		email : ''+req.body.email,
		password : ''+req.body.password,
		persistent : '1' === ''+req.body.persistent
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
				res.redirect('/main');
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
	res.render('register', {title : 'Registrieren'});
};

exports.doRegister = function(req, res) {
	// creates a new user/person or fails if any data is not given
	var person = {
		name : ''+req.body.user,
		email : ''+req.body.email,
		password : ''+req.body.password
	};
	
	if(person.name.length < 2) {
		res.redirect('/register?error=name');
		return;
	}
	if(!(/^[^@]+@[^@]+\.[^@]+$/.test(person.email))) {
		res.redirect('/register?error=email');
		return;
	}
	if(person.password.length < 6) {
		res.redirect('/register?error=password');
		return;
	}

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

exports.imprint = function(req, res) {
	res.render('imprint', {title : 'Impressum'});
};

exports.hello = function(req, res) {
	var sess = req.session;
	
	if(sess.loggedIn) {
		if(sess.views) {
			sess.views++;
			res.send('Views: '+sess.views);
			res.cookie('bla',sess.views, {signed: true});
		} else {
			sess.views = 1;
			res.send('Welcome to the view counter. Refresh!');
		}
	} else {
		res.send('Please login');
	}
};

exports.group = function(req, res) {
	res.send('Group: '+req.params.groupId);
};