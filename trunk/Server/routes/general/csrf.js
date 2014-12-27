
/*
 * General API to get the CSRF-Token
 *
 * Parameter: none
 *
 * Requirements: none
 *
 * Returns:
 * {
 *   token : string
 * }
 */
module.exports = function(req, res, opt) {
	res.json({
		token : req.csrfToken()
	});
};

