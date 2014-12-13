/*
 * Router for public available pages. 
 */

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
	
	res.render('register', {
		title : 'Registrieren',
		errors : errors,
		_csrf: req.csrfToken(),
		doNotShowNavbarLogin : true
	});
};

exports.imprint = function(req, res) {
	res.render('imprint', {title : 'Impressum', _csrf: req.csrfToken()});
};

exports.privacy = function(req, res) {
	res.render('privacy', {title : 'Datenschutzerklärung', _csrf: req.csrfToken()});
};

exports.policies = function(req, res) {
	res.render('policies', {title : 'Nutzungsbedinungen', _csrf: req.csrfToken()});
};
