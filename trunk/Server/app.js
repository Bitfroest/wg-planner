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
var compress = require('compression');
var routes = require('./routes');

//Create a new app
var app = express();

//Configure app object

//Disable the 'X-Powered-By: Express' header
app.disable('x-powered-by');

//Compress (gzip) replies if the browser supports that
//TODO does not work as expected
app.use(compress({threshold: 1}));

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

//Router for all dynamic services
routes(app);

//Error handler
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

//Start listening on a specific port
var server = app.listen(8080, function() {
	console.log('Listening on port %d', server.address().port);
});