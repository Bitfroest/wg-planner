var logger = require('../utils/log.js');

// if req.session.loggedIn is not true
exports.loggedIn = function(res) {
	res.status(403);
	res.json({
		'error' : 'notLoggedIn'
	});
};

// if req.getDb callbacks an error
exports.db = function(res, err) {
	logger.error('req.getDb failed', err);
	res.status(403);
	res.json({
		'error' : 'databaseError',
		'errorMessage' : err
	});
};

exports.query = function(res, err) {
	logger.error('client.query failed', err);
	res.status(403);
	res.json({
		'error' : 'queryError',
		'errorMessage' : err
	});
};

exports.validation = function(res, err) {
	res.status(403);
	res.json({
		'error' : 'validationError',
		'errorMessage' : err
	});
};

exports.entityNotFound = function(res, entityName) {
	res.status(403);
	res.json({
		'error' : 'entityNotFound',
		'errorMessage' : entityName
	});
};

exports.custom = function(res, message) {
	res.status(403);
	res.json(message);
};
