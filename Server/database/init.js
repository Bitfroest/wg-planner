var crypto = require('crypto');
var fs = require('fs');
var async = require('async');
var logger = require('../utils/log.js');

// Current schema version
var CURRENT_VERSION = 7;

// intitalize the database for wg planner
// make sure that:
// - the database schema exists
// - the database schema is up to date
exports.init = function(pg, url, callback) {
	async.waterfall([
		// connect to database the first time
		pg.connect.bind(pg, url),

		// check if table 'dbinfo' exists
		function testDbinfo(client, done, callback) {
			logger.info('check dbinfo table');

			client.query('SELECT EXISTS( SELECT 1 ' +
				'FROM information_schema.tables ' +
				'WHERE table_name = $1 LIMIT 1) as check',
				['dbinfo'],
				function(err, result) {

				callback(err, result, done);
			});
		}
	],
	function (err, result, done) {
		if(err) {
			callback(err);
			return;
		}

		done();

		if(result.rows.length !== 1) {
			callback('dbinfo must have exactly one row');
			return;
		}

		var tableExists = result.rows[0].check;

		if(tableExists) { // if table exists ...
			checkVersion(pg, url, callback);
		} else {
			createTables(pg, url, callback);
		}
	});
};

// check the version number that is saved in dbinfo.version
//  with CURRENT_VERSION
// upgrade the the database schema in case of a mismatch
function checkVersion(pg, url, callback) {
	pg.connect(url, function(err, client, done){
		if(err) {
			callback(err);
			return;
		}

		client.query('SELECT version, sessionsecret, cookiesecret FROM dbinfo', function(err, result) {
			done();

			if(err) {
				callback(err);
				return;
			}

			var version = result.rows[0].version;

			function successCallback() {
				callback(null, {
					cookieSecret : result.rows[0].cookiesecret,
					sessionSecret : result.rows[0].sessionsecret
				});
			}

			if(version === CURRENT_VERSION) {
				logger.info('database schema is up to date');
				successCallback();
			} else {
				logger.info('database schema must be upgraded from ' + version + ' to ' + CURRENT_VERSION);
				upgradeTables(version, pg, url, function(err) {
					if(err) {
						callback(err);
					} else {
						successCallback();
					}
				});
			}
		});
	});
}

// load upgrade scripts
// execute them in order
function upgradeTables(version, pg, url, callback) {
	var upgradeFiles = [];

	// create list of upgrade files to apply
	for(var ver = version; ver < CURRENT_VERSION; ver++) {
		upgradeFiles.push('./database/upgrade/upgrade_' +
			ver + '_' + (ver + 1) + '.sql');
	}

	// read SQL upgrade files
	async.map(upgradeFiles, function(path, callback) {
		logger.info('Load file ' + path);
		fs.readFile(path, 'utf-8', callback);
	}, function(err, results) {
		if(err) {
			callback(err);
			return;
		}

		// reduce list of SQL file data to one long SQL thingy
		var sql = results.join('\n');

		// get client
		pg.connect(url, function(err, client, done) {
			if(err) {
				callback(err);
				return;
			}

			async.waterfall([
				// start transaction
				function(callback) {
					client.query('BEGIN', callback);
				},

				// execute SQL update script
				function(result, callback) {
					client.query(sql, callback);
				},

				// upgrade version info in dbinfo table
				function(result, callback) {
					client.query('UPDATE dbinfo SET version = $1',
						[CURRENT_VERSION], callback);
				},

				// commit transaction
				function(result, callback) {
					client.query('COMMIT', callback);
				}
			], function(err) {
				done();
				callback(err);
			});
		});
	});
}

// load init.sql
// execute the SQL script on the database
function createTables(pg, url, callback) {
	pg.connect(url, function(err, client, done){
		if(err) {
			callback(err);
			return;
		}

		logger.info('Load file %s', './database/init.sql');

		async.waterfall([
			// Read the initial SQL script
			fs.readFile.bind(fs, './database/init.sql', 'utf-8'),

			// Create all the tables
			// (implicit file content as SQL parameter)
			client.query.bind(client),

			// generate secrets
			function(result, callback) {
				logger.info('created database schema');

				//Generate some secret keys used by cookieParser and session
				async.parallel({
					cookieSecret : crypto.randomBytes.bind(crypto, 16),
					sessionSecret : crypto.randomBytes.bind(crypto, 16)
				}, function(err, results) {
					if(err) {
						callback(err);
					}

					results.cookieSecret = results.cookieSecret.toString('hex');
					results.sessionSecret = results.sessionSecret.toString('hex');

					callback(undefined, results);
				});
			},

			// insert current schema version into table dbinfo
			function(dbinfo, callback) {
				client.query('INSERT INTO dbinfo ' +
					'(version,cookiesecret,sessionsecret) VALUES ($1,$2,$3)',
					[CURRENT_VERSION, dbinfo.cookieSecret, dbinfo.sessionSecret],
					function(err) {

					callback(err, dbinfo);
				});
			}
		],
		function(err, dbinfo) {
			done();

			if(err) {
				callback(err);
				return;
			}

			callback(null, dbinfo);
		});
	});
}
