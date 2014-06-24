var crypto = require('crypto');

exports.hashPassword = function(password, callback) {
	// generate salt
	crypto.randomBytes(64, function(err, salt) {
		if(err) {
			callback(err);
			return;
		}
	
		salt = salt.toString('hex');
	
		// hash password
		hash(password, salt, function(err, key){
			if(err) {
				callback(err);
				return;
			}
			
			callback(null, salt + ':' + key);
		});
	});
};

exports.checkPassword = function(userPassword, savedString, callback) {
	var splitted = savedString.split(':');
	var salt = splitted[0], savedPassword = splitted[1];
	
	hash(userPassword, salt, function(err, key){
		if(err) {
			callback(err, false);
			return;
		}
		
		callback(null, key == savedPassword);
	});
};

function hash(password, salt, callback) {
	crypto.pbkdf2(password, salt, 1000, 64, function(err, key) {
		if(err) {
			callback(err);
			return;
		}
		
		callback(null, key.toString('hex'));
	});
}