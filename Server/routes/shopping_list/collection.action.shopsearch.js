var errors = require('../api-errors');


/*
* API function to get typeahead list.
*
* Parameter:
*	- search string: substring to search for
*
* Requirements:
*	- loggedIn
*
* Return type:
* [ {
*	name: string
* } ]
*/

module.exports = function(req, res, opt) {
	if(!req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	
	opt.client.query("SELECT DISTINCT shop_name as name, similarity($2, shop_name) as sim FROM shopping_list sl JOIN household_member hm " +
		"ON (hm.household_id = sl.household_id) " +
		"where hm.person_id = $1 ORDER BY sim DESC LIMIT 8", [req.session.personId, req.query.search], function (err, result){
			if(err){
				errors.query(res, err);
				return;
			}
			res.json({
				result : result.rows,
				search : req.query.search
			});
		});	
};