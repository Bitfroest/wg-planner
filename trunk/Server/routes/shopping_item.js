exports.shoppingItemCreate = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('shopping_list').isInt();
		req.checkBody('name').isLength(1);
		req.checkBody('owner').isInt();
		req.checkBody('price').isFloat();
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		req.sanitize('shopping_list').toInt();
		req.sanitize('name').toString();
		req.sanitize('owner').toInt();
		req.sanitize('price').toFloat();
	
		var form = {
			shoppingList : req.body.shopping_list,
			name : req.body.name,
			owner : req.body.owner,
			price : req.body.price * 100
		};
	
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shopping_item.shoppingItemCreate');
			}
			
			client.query(
				'SELECT EXISTS(SELECT 1 ' +
				'FROM shopping_list l ' +
				'JOIN household_member m ON (m.household_id=l.household_id) ' +
				'WHERE l.id=$1 AND m.person_id=$2 LIMIT 1) AS is_member, ' +
				'EXISTS (SELECT 1 ' +
				'FROM shopping_list l '+
				'JOIN household_member m ON (m.household_id=l.household_id) ' +
				'WHERE l.id=$1 AND m.person_id=$3 LIMIT 1) AS owner_is_member',
				[form.shoppingList, req.session.personId, form.owner],
				function(err, result) {
				
				if(err) {
					return console.error('Could not load membership information', err);
				}
				
				if(result.rows[0].is_member == false) {
					res.redirect('/internal_error?not_member');
					return;
				}
				
				if(result.rows[0].owner_is_member == false) {
					res.redirect('/internal_error?owner_not_member');
					return;
				}
				
				client.query('INSERT INTO shopping_item (name, shopping_list_id, owner_person_id, price) VALUES ($1,$2,$3,$4)',
					[form.name, form.shoppingList, form.owner, form.price],
					function(err, result) {
				
					done();
				
					if(err) {
						return console.error('Could not insert new shopping item', err);
					}
					
					res.redirect('/shopping_list/' + form.shoppingList);
				});
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};