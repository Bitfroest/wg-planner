exports.shoppingListCreate = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household').isInt();
		req.checkBody('buyer').isInt();
		req.checkBody('shop').isLength(1);
		req.checkBody('shopped_date').matches(/^[0-3]?[0-9]\.[01]?[0-9]\.[0-9]{4}$/);
		req.checkBody('shopped_time').matches(/^[0-2]?[0-9]:[0-5]?[0-9]$/);
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		req.sanitize('household').toInt();
		req.sanitize('buyer').toInt();
		req.sanitize('shop').toString();
		req.sanitize('shopped_date').toString();
		req.sanitize('shopped_time').toString();
	
		var dateParts = String.prototype.split.call(req.body.shopped_date, '.');
		var timeParts = String.prototype.split.call(req.body.shopped_time, ':');
	
		var form = {
			household : req.body.household,
			buyer : req.body.buyer,
			shop : req.body.shop,
			shopped : new Date(dateParts[2], dateParts[1]-1, dateParts[0], timeParts[0], timeParts[1])
				// year, month, day, hour, minute, second, millisecond
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
				
				client.query('INSERT INTO shopping_list(shop_name,household_id,buyer_person_id,creator_person_id,shopped,created)' +
					' VALUES($1,$2,$3,$4,$5,$6)',
					[form.shop, form.household, form.buyer, req.session.personId, form.shopped, new Date()], function(err, result) {
				
					done();
				
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