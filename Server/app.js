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
var logger = require('./utils/log.js');
var _ = require('underscore');
var multer = require('multer');
var upload = multer({ dest: 'public/receipts/' });

// Load configuration, show info message on failure
var config;
try {
	config = require('./config.js');
} catch(err) {
	if(err.code === 'MODULE_NOT_FOUND') {
		logger.error('Could not find the configuration file config.js');
		logger.error('Please follow the instructions in template.config.js');
		process.exit(1);
	}
}

require('./database/init.js').init(pg, config.databaseURL, function(err, dbinfo) {

// check errors in database initialization
if(err) {
	logger.error(err);
	return;
}

//check dbinfo
if(! _.isObject(dbinfo)) {
	logger.error('dbinfo is not initialized');
}

if(! _.isString(dbinfo.cookieSecret)) {
	logger.error('dbinfo.cookieSecret is not initialized');
} else if(dbinfo.cookieSecret === '') {
	logger.error('dbinfo.cookieSecret is empty');
}

if(! _.isString(dbinfo.sessionSecret)) {
	logger.error('dbinfo.sessionSecret is not initialized');
} else if(dbinfo.sessionSecret === '') {
	logger.error('dbinfo.sessionSecret is empty');
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

// forward useCDN setting to views
app.locals._useCDN = config.useCDN;

//Use jade as view engine
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
if(app.get('env') === 'development') {
	app.locals.pretty = true;
}

// Request logging with winston using morgan
var winstonStream = {
    write: function(message /*, encoding*/) {
    	//strip line ending
    	message = message.slice(0, -1);
        logger.info(message);
    }
};

var morganFormat = ':remote-addr :method :url HTTP/:http-version :status - :response-time ms';

if(app.get('env') === 'development') {
	morganFormat = 'dev';
}

app.use(morgan(morganFormat, {stream: winstonStream}));

//Compress (gzip) replies if the browser supports that
//TODO does not work as expected
app.use(compress(/*{threshold: '1kb'}*/));

//Serve static files (images/stylesheets/javascripts) from public/ folder
app.use(serveStatic('public/'));

// redirect /path/ to /path
app.use(slashes(false));

//Parse body (urlencoded/json) from HTML forms and XHR requests
app.use(bodyParser());

// Parse other bodies
app.use(upload.single('receipt'));

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
		logger.warn('someone used invalid csrf token');
		res.send(403, 'Invalid CSRF Token');
	} else {
		logger.error("express error handler", err.stack);
		res.status(500).render('error-500', {
			title: 'Interner Fehler',
			err : app.get('env') === 'development' ? err : undefined // show details only in development mode
		});
	}

	// call next error handler
	//next(err);
});

//Start listening on a specific port
var server = app.listen(config.httpPort || 8080, function() {
	logger.info('Listening on port %d in %s mode', server.address().port, app.get('env'));
	if(app.get('env') === 'development') {
		logger.info('Visit http://localhost:%d/ now', server.address().port);
	}
});

});
