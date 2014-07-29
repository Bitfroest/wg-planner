var crypto = require('crypto');
var fs = require('fs');

// Current schema version
var CURRENT_VERSION = 1;

exports.init = function(pg, url, callback) {
	// connect to database the first time
	pg.connect(url, function(err, client, done){
		if(err) {
			return console.error('Failed to connect in init', err);
		}
		
		// check if table 'dbinfo' exists
		client.query("SELECT EXISTS( SELECT * FROM information_schema.tables WHERE table_name = 'dbinfo') as check",
			function(err, result){
				done();
				
				if(err) {
					return console.error('Failed to check if dbinfo exists', err);
				}
				
				var tableExists = result.rows[0].check;
				
				if(tableExists) { // if table exists ...
					checkVersion(pg, url, callback);
				} else {
					createTables(pg, url, callback);
				}
			}
		);
	});
};

function checkVersion(pg, url, callback) {
	pg.connect(url, function(err, client, done){
		if(err) {
			return console.error('Failed to connect in checkVersion', err);
		}
		
		client.query('SELECT version, sessionsecret, cookiesecret FROM dbinfo', function(err, result){
			done();
			
			if(err) {
				return console.error('Failed to get version from dbinfo', err);
			}
			
			var version = result.rows[0].version;
			
			if(version == CURRENT_VERSION) {
				console.info('database schema is up to date');
			} else {
				console.info('database schema must be upgraded');
			}
			
			callback(null, {
				cookieSecret : result.rows[0].cookiesecret,
				sessionSecret : result.rows[0].sessionsecret
			});
		});
	});
}

function createTables(pg, url, callback) {
	pg.connect(url, function(err, client, done){
		if(err) {
			return console.error('Failed to connect in createTables', err);
		}
		
		// Read the initial SQL script
		fs.readFile('./database/init.sql', 'utf-8', function(err, sql){
			if(err) {
				return console.error('Failed to load init.sql', err);
			}
		
			// Create all the tables
			client.query(sql, function(err, result){
				if(err) {
					return console.error('Failed to create tables', err);
				}
				
				console.info('created database schema');
				
				//Generate some secret keys used by cookieParser and session
				var cookieSecret = crypto.randomBytes(16).toString('hex');
				var sessionSecret = crypto.randomBytes(16).toString('hex');
				
				// insert current schema version into table dbinfo
				client.query('INSERT INTO dbinfo (version,cookiesecret,sessionsecret) VALUES ($1,$2,$3)',
					[CURRENT_VERSION, cookieSecret, sessionSecret], function(err, result) {
					
					done();
					
					if(err) {
						return console.error('Failed to insert current version', err);
					}
					
					callback(null, {
						cookieSecret: cookieSecret,
						sessionSecret: sessionSecret
					});
				});
			});
		});
	});
}