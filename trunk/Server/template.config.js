/*
 * This is a template for the wg-planner configuration file called 'config.js'.
 * Copy and rename this file to 'config.js' in order to have a proper config file.
 */

module.exports = {
	// Database connection URL, for PostgreSQL: postgres://username:password@localhost/database
	databaseURL : '',
	
	// HTTP port used for the application web server, should be port 80 for production and 8080 for development
	httpPort : 8080,
	
	// use an external content delivery network, should be false for (offline) development
	useCDN : false,
	
	// Path to Postgresql's bin folder (with trailing slash/backslash)
	// - for Linux this is mostly not needed and can be ''
	// - for Windows this must be configured to something like 'C:\\Program Files\\PostgreSQL\\9.3\\bin\\'
	postgresBin : ''
};
