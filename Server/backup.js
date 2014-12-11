var config = require('./config.js');
var spawn = require('child_process').spawn;
var path = require('path');
var padding = require('./utils/date_formatter').zeroPadding2;

if(process.argv.length !== 3) {
	console.warn('Usage: node backup.js <backup folder>');
	process.exit(1);
}

var backupFolder = process.argv[2];

var now = new Date();
var filename = ['/backup',
	now.getFullYear(), padding(now.getMonth() + 1), padding(now.getDate()),
	padding(now.getHours()), padding(now.getMinutes()), padding(now.getSeconds())].join('_');

// join file name with given backup folder	
filename = path.join(backupFolder, filename);

// resolve relative path to current working directory
filename = path.resolve(filename);

var dumper = spawn(config.postgresBin + 'pg_dump', ['--format=custom', '-f', filename], {
	cwd : __dirname,
	stdio: ['ignore', 1, 2],
	env : {
		PGDATABASE : config.databaseDatabase,
		PGHOST : config.databaseHost,
		PGPORT : config.databasePort,
		PGUSER : config.databaseUser,
		PGPASSWORD : config.databasePassword // TODO: giving password via environment variable can be insecure
	}
});

dumper.on('error', function(err) {
	console.error('Failed to spawn', err);
	process.exit(1);
});

dumper.on('exit', function(code) {
	if(code !== 0) {
		console.error('pg_dump returned with %d', code);
		process.exit(1);
	}

	console.info('%s', filename);
});
