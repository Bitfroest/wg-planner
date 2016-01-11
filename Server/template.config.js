/*
 * This is a template for the wg-planner configuration file called 'config.js'.
 * Copy and rename this file to 'config.js' in order to have a proper config file.
 */

var config = {};

// **************************************************
// BEGIN CONFIG
// **************************************************

// PostgreSQL connection details, change as needed
config.databaseUser = 'postgres';
config.databasePassword = '';
config.databaseHost = 'localhost';
config.databasePort = 5432;
config.databaseDatabase = 'postgres';

// Database connection URL, for PostgreSQL: postgres://username:password@localhost/database
// DOT NOT CHANGE: this will be created for you out of database* configurations
config.databaseURL = 'postgres://' + (config.databaseUser ? encodeURIComponent(config.databaseUser) +
	(config.databasePassword ? ':' + encodeURIComponent(config.databasePassword) : '') + '@' : '') +
	config.databaseHost + (config.databasePort ? ':' + config.databasePort : '') +
	'/' + encodeURIComponent(config.databaseDatabase);

// HTTP port used for the application web server, should be port 80 for production and 8080 for development
config.httpPort = 8080;

// use an external content delivery network, should be false for (offline) development
config.useCDN = false;

// Path to Postgresql's bin folder (with trailing slash/backslash)
// - for Linux this is mostly not needed and can be ''
// - for Windows this must be configured to something like 'C:\\Program Files\\PostgreSQL\\9.3\\bin\\'
config.postgresBin = '';

// Set to true if you want send emails when a new user
// registers on your wg planner.
config.sendRegistrationMail = false;

// e-email address that will be set as the 'from' when sending a mail
config.mailFrom = '';

// you should put all your email transportation
// options here.
// more info: https://github.com/andris9/nodemailer-smtp-transport#usage
config.mailTransportOptions = {
	service: '', // put a wellknown service here (e.g. gmail, 1und1)
	host: '', // or put a host name and a port
	port: 25,
	auth: {
		user: '', // user name
		pass: ''  // password
	}
};

// Absolute path to Tesseract
config.tesseractPath = '/usr/bin/tesseract';

// **************************************************
// END CONFIG
// **************************************************

// Export config object
module.exports = config;
