
var path = require('path');
var fs = require('fs');
var jade = require('jade');
var validators = require('./validators.js');
var errors = require('../api-errors');
var passwordHelper = require('../password.js');
var mail = require('../../utils/send_mail.js');
var config = require('../../config.js');

/*
 * Router for registering a new person.
 *
 * Parameter:
 * - name string: name of the person
 * - email string: mail address of the person
 * - password string: password of the person
 * - terms string: accepted privacy and policies
 *
 * Requirements: none.
 */
module.exports = function(req, res, opt) {
	// creates a new user/person or fails if any data is not given
	
	validators.validateName(req);
	validators.validateEmail(req);
	validators.validatePassword(req);
	validators.validateTerms(req);
	
	var err = req.validationErrors();
	
	if(err) {
		errors.validation(res, err);
		return;
	}
	
	var person = {};
	validators.sanitizeName(req, person);
	validators.sanitizeEmail(req, person);
	validators.sanitizePassword(req, person);

	passwordHelper.hashPassword(person.password, function(err, key) {
		if(err) {
			errors.custom(res, {
				error : 'hash_password'
			});
			return;
		}
		
		// insert new person into database
		opt.client.query('INSERT INTO person(name,email,password,role,created) VALUES($1,$2,$3,$4,$5) ' +
			'RETURNING name, email, role, id',
			[person.name, person.email, key, 'customer', new Date()], function(err, result) {
			
			if(err) {
				errors.query(res, err);
				return;
			}
			
			if(config.sendRegistrationMail) {
				fs.readFile(path.resolve(__dirname, 'registration.jade'), 'utf-8', function(err, jadeSource) {
					var html = jade.render(jadeSource, {
						pretty: true,
						person: person
					});
				
					mail.sendMail({
						to: person.email,
						subject: 'Congratulations: Your new account has been created!',
						html: html
					}, function(error, info) {
						if(error) {
							console.log(error);
						} else {
							console.log('Message sent: ' + info.response);
						}
					});
				});
			}
			
			res.json({
				result : result.rows[0]
			});
		});
	});
};

