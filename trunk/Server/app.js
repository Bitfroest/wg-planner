/*
 * Main application
 *
 * Starts the server, installs the middleware and routes requests.
 */

var crypto = require('crypto');
var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

//Create a new app
var app = express();

//Serve static files (images/stylesheets/javascripts) from public/ folder
app.use(serveStatic('public/'));

//Parse body (urlencoded/json) from HTML forms and XHR requests
app.use(bodyParser());

//Generate some secret keys used by cookieParser and session
var cookieSecret = crypto.randomBytes(16).toString('hex');
var sessionSecret = crypto.randomBytes(16).toString('hex');

//Parse cookies from request headers
app.use(cookieParser(cookieSecret));

//Session by session cookie and in-memory session management
app.use(session({
	name: 'sid',
	secret: sessionSecret
}));

//TEST ROUTING
app.get('/hello.txt', function(req, res) {
	var sess = req.session;
	if(sess.views) {
		sess.views++;
		res.send('Views: '+sess.views);
		res.cookie('bla',sess.views, {signed: true});
	} else {
		sess.views = 1;
		res.send('Welcome to the view counter. Refresh!');
	}
});

app.get('/group/:groupId', function(req, res) {
	res.send('Group: '+req.params.groupId);
});
//END TEST ROUTING

//Error handler
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

//Start listening on a specific port
var server = app.listen(8080, function() {
	console.log('Listening on port %d', server.address().port);
});