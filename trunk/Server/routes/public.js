/*
 * Router for public available pages. 
 */

exports.index = function(req, res) {
	res.render('home');
};
 
exports.login = function(req, res) {
	res.render('login', {title : 'Anmelden'});
};

exports.register = function(req, res) {
	res.render('register', {title : 'Registrieren'});
};

exports.hello = function(req, res) {
	var sess = req.session;
	if(sess.views) {
		sess.views++;
		res.send('Views: '+sess.views);
		res.cookie('bla',sess.views, {signed: true});
	} else {
		sess.views = 1;
		res.send('Welcome to the view counter. Refresh!');
	}
};

exports.group = function(req, res) {
	res.send('Group: '+req.params.groupId);
};