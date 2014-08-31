/*
 * Main application
 *
 * Starts the server, installs the middleware and routes requests.
 */

var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var compress = require('compression');
var morgan = require('morgan');
var expressValidator = require('express-validator');
var csrf = require('csurf');
var slashes = require("connect-slashes");
var routes = require('./routes');
var pg = require('pg.js');
var PostgresStore = require('./database/pg-session.js')(session);

// Load configuration, show info message on failure
var config;
try {
	config = require('./config.js');
} catch(err) {
	if(err.code === 'MODULE_NOT_FOUND') {
		console.warn('Could not find the configuration file config.js');
		console.warn('Please follow the instructions in template.config.js');
		return;
	}
}

require('./database/init.js').init(pg, config.databaseURL, function(err, dbinfo) {

// check errors in database initialization
if(err) {
	console.error(err);
	return;
}

//Create a new app
var app = express();

//Configure app object

//Disable the 'X-Powered-By: Express' header
app.disable('x-powered-by');

// SEO as hell
// read more: http://googlewebmastercentral.blogspot.de/2010/04/to-slash-or-not-to-slash.html
app.enable('strict routing');
app.enable('case sensitive routing');

//Use jade as view engine
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
if(app.get('env') == 'development') {
	app.locals.pretty = true;
}

//Request logger (see console), only for development
//if(app.get('env') == 'development') {
	app.use(morgan('dev'));
//}

//Compress (gzip) replies if the browser supports that
//TODO does not work as expected
app.use(compress(/*{threshold: '1kb'}*/));

//Serve static files (images/stylesheets/javascripts) from public/ folder
app.use(serveStatic('public/'));

// redirect /path/ to /path
app.use(slashes(false));

//Parse body (urlencoded/json) from HTML forms and XHR requests
app.use(bodyParser());

//Form validator
app.use(expressValidator());

//Parse cookies from request headers
app.use(cookieParser(dbinfo.cookieSecret));

//Session by session cookie and in-memory session management
app.use(session({
	name: 'sid',
	secret: dbinfo.sessionSecret,
	store: new PostgresStore(pg, config.databaseURL)
	//cookie: {secure: false, maxAge: 300000}
}));

//CSRF protection
app.use(csrf());

app.use(function(req, res, next) {
	req.getDb = pg.connect.bind(pg, config.databaseURL);
	next();
});

//Router for all dynamic services
routes(app);

// Send custom 404 error page
app.use(function(req, res) {
	res.status(404).render('error-404', {
		title : 'Seite nicht gefunden!',
		url : decodeURI(req.path)
	});
});

//Error handler
app.use(function(err, req, res, next){
	if(err.message === 'invalid csrf token') {
		res.send(403, 'Invalid CSRF Token');
	} else {
		console.error(err.stack);
		res.status(500).render('error-500', {
			title: 'Interner Fehler',
			err : app.get('env') === 'development' ? err : undefined // show details only in development mode
		});
	}
});

//Start listening on a specific port
var server = app.listen(config.httpPort || 8080, function() {
	console.log('Listening on port %d in %s mode', server.address().port, app.get('env'));
});

});
