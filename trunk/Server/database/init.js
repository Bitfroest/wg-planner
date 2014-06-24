
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
		
		client.query('SELECT version FROM dbinfo', function(err, result){
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
			
			callback(null);
		});
	});
}

function createTables(pg, url, callback) {
	pg.connect(url, function(err, client, done){
		if(err) {
			return console.error('Failed to connect in createTables', err);
		}
		
		var TABLES = [
			'CREATE TABLE dbinfo(version INTEGER)',
			'CREATE TABLE person(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email UNIQUE TEXT NOT NULL, password TEXT NOT NULL)'
		];
		
		// Create all the tables
		client.query(TABLES.join(';'), function(err, result){
			if(err) {
				return console.error('Failed to create tables', err);
			}
			
			// insert current schema version into table dbinfo
			client.query('INSERT INTO dbinfo (version) VALUES ($1)', [CURRENT_VERSION], function(err, result) {
				done();
				
				if(err) {
					return console.error('Failed to insert current version', err);
				}
				
				callback(null);
			});
		});
	});
}