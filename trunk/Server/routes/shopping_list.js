exports.shoppingListCreate = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household').isInt();
		req.checkBody('buyer').isInt();
		req.checkBody('shop').isLength(1);
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		req.sanitize('household').toInt();
		req.sanitize('buyer').toInt();
		req.sanitize('shop').toString();
	
		var form = {
			household : req.body.household,
			buyer : req.body.buyer,
			shop : req.body.shop
		};
	
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.household');
			}
			
			client.query('SELECT EXISTS (SELECT 1 FROM household_member WHERE household_id=$1 AND person_id=$2 LIMIT 1) AS is_member',
				[form.household, req.session.personId], function(err, result) {
			
				if(err) {
					return console.error('Failed to check if household member', err);
				}
				
				if(result.rows.length == 0 || result.rows[0].is_member == false) {
					res.redirect('/internal_error?not_member');
					return;
				}
				
				client.query('INSERT INTO shopping_list(shop_name,household_id,buyer_person_id,created) VALUES($1,$2,$3,$4)',
					[form.shop, form.household, form.buyer, new Date()], function(err, result) {
				
					if(err) {
						return console.error('Failed to insert new shopping_list', err);
					}
					
					res.redirect('/household/' + form.household);
				});
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};