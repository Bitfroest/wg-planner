
exports.validateName = function(req) {
	req.checkBody('name', 'Name muss zwischen 3 und 20 Zeichen lang sein.').isLength(3, 20);
	req.checkBody('name', 'Name darf nur Buchstaben, Zahlen, Punkte, Binde- und Unterstriche enthalten.').matches(/^[a-zA-Z][a-zA-Z0-9 \.\-_]*$/);
};

exports.sanitizeName = function(req, form) {
	form.name = req.sanitize('name').toString();
};

exports.validatePassword = function(req) {
	req.checkBody('password').isLength(6, 40);
};

exports.sanitizePassword = function(req, form) {
	form.password = req.sanitize('password').toString();
};

exports.validateEmail = function(req) {
	req.checkBody('email').isLength(5, 60).isEmail();
};

exports.sanitizeEmail = function(req, form) {
	form.email = req.sanitize('email').toString();
};

exports.validateTerms = function(req) {
	req.checkBody('terms', 'Nutzungebedinungen und Datenschutzerklärung muss akzeptiert werden.').matches(/^1$/);
};

