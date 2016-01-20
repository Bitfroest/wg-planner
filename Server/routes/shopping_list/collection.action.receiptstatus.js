var errors = require('../api-errors');
var path = require('path');

module.exports = function (req, res, opt) {
	if(!req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	console.log(req.query.shoppingListId +' '+ req.session.personId)
	opt.client.query('SELECT i.shopping_list_id AS id, i.file AS file, i.status AS status ' +
		'FROM shopping_list_receipt i ' +
		'JOIN shopping_list sl ON (i.shopping_list_id = sl.id) ' +
		'JOIN household_member hm ON (hm.household_id = sl.household_id and hm.person_id = $2) ' +
		'WHERE i.shopping_list_id = $1 ',
		[req.query.shoppingListId, req.session.personId], function (err, result){
			if(err){
				errors.query(res, err);
				return;
			}
			for(var a in result.rows){
				result.rows[a].file = result.rows[a].file.split(path.sep).slice(1).join("/");
			}
			res.json({
				result : result.rows
			});
	});
};
