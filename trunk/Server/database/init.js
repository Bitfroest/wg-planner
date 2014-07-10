var crypto = require('crypto');

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
		
		var TABLES = [
			'CREATE TABLE dbinfo(version INTEGER NOT NULL, cookiesecret TEXT NOT NULL, sessionsecret TEXT NOT NULL)',
			'CREATE TABLE session(id TEXT PRIMARY KEY, data TEXT NOT NULL, created TIMESTAMPTZ NOT NULL)',
			"CREATE TYPE person_role AS ENUM('customer', 'admin')",
			'CREATE TABLE person(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role person_role NOT NULL, created TIMESTAMPTZ NOT NULL)',
			'CREATE TABLE household(id SERIAL PRIMARY KEY, name TEXT NOT NULL, created TIMESTAMPTZ NOT NULL)',
			"CREATE TYPE household_member_role AS ENUM('member', 'founder')",
			'CREATE TABLE household_member(household_id INTEGER REFERENCES household(id) NOT NULL, person_id INTEGER REFERENCES person(id) NOT NULL, role household_member_role NOT NULL, created TIMESTAMPTZ NOT NULL)',
			'CREATE TABLE household_invitation(household_id INTEGER REFERENCES household(id) NOT NULL, from_person_id INTEGER REFERENCES person(id) NOT NULL, to_person_id INTEGER REFERENCES person(id) NOT NULL, created TIMESTAMPTZ NOT NULL)'
		];
		
		// Create all the tables
		client.query(TABLES.join(';'), function(err, result){
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
}