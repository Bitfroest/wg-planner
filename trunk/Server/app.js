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
var morgan = require('morgan');
var routes = require('./routes');
var config = require('./config.js');
var pg = require('pg.js');
var PostgresStore = require('./database/pg-session.js')(session);

require('./database/init.js').init(pg, config.databaseURL, function(err) {

//Create a new app
var app = express();

//Configure app object

//Disable the 'X-Powered-By: Express' header
app.disable('x-powered-by');

//Use jade as view engine
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
if(app.get('env') == 'development') {
	app.locals.pretty = true;
}

//Request logger (see console), only for development
if(app.get('env') == 'development') {
	app.use(morgan('dev'));
}

//Compress (gzip) replies if the browser supports that
//TODO does not work as expected
app.use(compress(/*{threshold: '1kb'}*/));

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
	secret: sessionSecret,
	store: new PostgresStore(pg, config.databaseURL)
	//cookie: {secure: false, maxAge: 300000}
}));

app.use(function(req, res, next){
	req.getDb = function(callback) {
		pg.connect(config.databaseURL, callback);
	};
	next();
});

//Router for all dynamic services
routes(app);

//Error handler
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!');
});

//Start listening on a specific port
var server = app.listen(8080, function() {
	console.log('Listening on port %d in %s mode', server.address().port, app.get('env'));
});

});