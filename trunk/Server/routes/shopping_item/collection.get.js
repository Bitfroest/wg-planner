var errors = require('../api-errors');


module.exports = function (req, res, opt) {
	if(!req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	
	opt.client.query('SELECT i.id AS id, i.name AS name, p.name as owner_name, i.price AS price ' +
		'FROM shopping_item i ' +
		'JOIN shopping_list sl ON (i.shopping_list_id = sl.id) ' +
		'JOIN household_member hm ON (hm.household_id = sl.household_id and hm.person_id = $2) ' +
		'LEFT JOIN person p ON (i.owner_person_id=p.id) ' +
		'WHERE i.shopping_list_id = $1 ',
		[req.query.shoppingListId, req.session.personId], function (err, result){
			if(err){
				errors.query(res, err);
				return;
			}
			res.json({
				result : result.rows
			});
	});	
};