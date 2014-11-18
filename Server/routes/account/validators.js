
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

