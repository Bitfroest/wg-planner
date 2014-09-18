var config = require('./config.js');
var spawn = require('child_process').spawn;

if(process.argv.length !== 3) {
	console.warn('Please tell me the name of your backup file!');
	return;
}

var filename = process.argv[2];

var dumper = spawn(config.postgresBin + 'pg_restore', ['--clean', '-d', config.databaseDatabase,filename], {
	cwd : __dirname,
	stdio: ['ignore', 1, 2],
	env : {
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
	console.info('Restored, Exit code: %d', code);
});
