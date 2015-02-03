var errors = require('../api-errors');


module.exports = function (req, res, opt) {
	if(!req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	
	opt.client.query(
		'SELECT is_household_member(get_household_id_by_shopping_item_id($1), $2) as is_member',
		[req.params.id, req.session.personId], function(err, result) {
		
		if(err) {
			errors.query(res, err);
			return;
		}
		
		if(! result.rows[0].is_member) {
			errors.custom(res, result.rows[0]);
			return;
		}
		
		opt.client.query(
			'DELETE FROM shopping_item WHERE id=$1 RETURNING shopping_list_id',
			[req.params.id], function(err, result) {
		
			if(err) {
				errors.query(res, err);
			}
			
			if(result.rowCount !== 1) {
				errors.entityNotFound(res, "shopping_item");
				return;
			}
			
			res.json({
				success : true
			});				
				
		});
	});
};