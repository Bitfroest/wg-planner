var config = require('./config.js');
var spawn = require('child_process').spawn;
var padding = require('./utils/date_formatter').zeroPadding2;

var now = new Date();
var filename = ['./database/backups/', 'backup_',
	now.getFullYear(), '_', padding(now.getMonth() + 1), '_', padding(now.getDate()),
	'_', padding(now.getHours()), '_', padding(now.getMinutes()), '_', padding(now.getSeconds())].join('');


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
});

dumper.on('exit', function(code) {
	console.info('Backup ready, Exit code: %d', code);
	console.info('File: %s', filename);
});
