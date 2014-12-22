var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var htmlToText = require('nodemailer-html-to-text').htmlToText;

var config = require('../config.js');

var transporter = nodemailer.createTransport(smtpTransport(config.mailTransportOptions));
transporter.use('compile', htmlToText({
	wordwrap: 80
}));

exports.sendMail = function (data, callback) {
	// set the from header if not set (from config)
	if(! data.from) {
		data.from = config.mailFrom;
	}
	
	transporter.sendMail(data, callback);
};

