var config = require('./config.js');
var pg = require('pg.js');
var fs = require('fs');

fs.readFile('./database/reset.sql', 'utf-8', function(err, sql){
	if(err) {
		return console.error('Failed to load reset.sql !', err);
	}

	var client = new pg.Client(config.databaseURL);
	
	client.connect(function(err) {
		if(err) {
			return console.error('Failed to connect.', err);
		}
	
		client.query(sql, function(err) {
			if(err) {
				return console.error('Failed to reset database.', err);
			}
			
			console.info('Resetted database!');
			
			client.end();
		});
	});
});