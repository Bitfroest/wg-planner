var async = require('async');

function validateShoppingItem(req, ownerArray) {
	req.checkBody('name').isLength(1, 50);
	if(ownerArray) {
		// TODO hier bitte int array validieren
	} else {
		req.checkBody('owner').isInt();
	}
	req.checkBody('price').matches('^[0-9]+[,\\.]?[0-9]*$');
}

function sanitizeShoppingItem(req, form, ownerArray) {
	form.name = req.sanitize('name').toString();
	if(ownerArray) {
		form.owner = req.sanitize('owner').toString().split('|');
	} else {
		form.owner = req.sanitize('owner').toInt();
	}
	form.price = Math.round(req.sanitize('price').toString().replace(',','.') * 100);
}

/*
 * Router for displaying a single shopping item
 *
 * Parameter:
 * - id int: ID of the displayed shopping item
 *
 * Requirements:
 * - loggedIn
 * - shopping item must exist
 * - Protagonist must be member of the household belonging
 *   to the shopping list belonging to the shopping item
 */
exports.shoppingItem = function(req, res) {
	if(req.session.loggedIn) {
		
		req.checkParams('id').isInt();
		
		var errors = req.validationErrors();
		
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		var form = {
			id : req.sanitize('id').toInt()
		};
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shoppingItem', err);
			}
			
			async.series({
				item : client.query.bind(client, 'SELECT i.id AS id, i.name AS name, i.owner_person_id AS owner, i.price AS price, ' +
					'm.role IS NOT NULL AS is_member, l.id AS shopping_list_id, l.household_id AS household_id ' +
					'FROM shopping_item i LEFT JOIN shopping_list l ON (i.shopping_list_id=l.id) ' +
					'LEFT JOIN household_member m ON (l.household_id=m.household_id AND m.person_id=$1) ' +
					'WHERE i.id=$2', [req.session.personId, form.id]),
				members : client.query.bind(client, 'SELECT p.id AS id, p.name AS name ' +
					'FROM shopping_item i JOIN shopping_list l ON (i.shopping_list_id=l.id) ' +
					'JOIN household_member m ON (l.household_id=m.household_id) ' +
					'JOIN person p ON (p.id=m.person_id) WHERE i.id=$1',
					[form.id])
			}, function(err, result) {
			
				done();
			
				if(err) {
					return console.error('Failed to load shopping item data', err);
				}
				
				if(result.item.rows.length !== 1) {
					res.redirect('/internal_error?item_not_found');
					return;
				}
				
				if(!result.item.rows[0].is_member) {
					res.redirect('/internal_error?not_member');
					return;
				}
				
				var item = result.item.rows[0];
				
				res.render('shopping_item', {
					_csrf : req.csrfToken(),
					item : item,
					members : result.members.rows,
					title : 'Einkaufsartikel',
					breadcrumbs : [
						{url: '/household/' + item.household_id, text: 'Haushalt'},
						{url: '/shopping_list/' + item.shopping_list_id, text: 'Einkaufsliste'},
						{url: '/shopping_item/' + item.id, text: 'Einkaufsartikel'}
					]
				});
			});	
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for creating shopping items.
 *
 * Parameter: 
 * - shopping_list int: ID of the shopping list that will be parent of the new shopping item
 * - name string: name of the item
 * - owner int: ID of the person who want to have this item
 * - price float: price in Euro of the item (using '.' as decimal separator)
 *
 * Requirements:
 * - loggedIn
 * - Protagonist and owner must be member of the household belonging to the shopping list
 */
exports.shoppingItemCreate = function(req, res) {
	if(req.session.loggedIn) {
	
		validateShoppingItem(req, true);
		req.checkBody('shopping_list').isInt();
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
	
		var form = {
			shoppingList : req.sanitize('shopping_list').toInt()
		};
		sanitizeShoppingItem(req, form, true);
	
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shopping_item.shoppingItemCreate');
			}
			
			var queries = [];
			
			queries.push(client.query.bind(client,
				'SELECT is_household_member(get_household_id_by_shopping_list_id($1), $2) AS is_member',
				[form.shoppingList, req.session.personId]
			));
			
			for(var i = 0; i < form.owner.length; i++) {
				queries.push(client.query.bind(client,
					'SELECT is_household_member(get_household_id_by_shopping_list_id($1), $2) AS is_member',
					[form.shoppingList, form.owner[i]]
				));
			}
			
			async.series(queries, function(err, result) {
				if(err) {
					return console.error('Could not load membership information', err);
				}
				
				var i;
				
				for(i = 0; i < result.length; i++) {
					if(! result[i].rows[0].is_member) {
						res.redirect('/internal_error?not_member' + i);
						return;
					}
				}
				
				
				// TODO preis durch anzahl owner teilen
				form.price = Math.ceil(form.price/form.owner.length);
				
				var queries = [];
				
				for(i = 0; i < form.owner.length; i++) {
					queries.push(client.query.bind(client,
						'INSERT INTO shopping_item (name, shopping_list_id, owner_person_id, price) VALUES ($1,$2,$3,$4)',
						[form.name, form.shoppingList, form.owner[i], form.price]
					));
				}
				
				async.series(queries, function(err) {
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

/*
 * Router for updating shopping items
 *
 * Parameter:
 * - id int: ID of shopping item to update
 * - name string: new name of the shopping item
 * - owner int: new ID of the owner for the shopping item
 * - price float: new price of the shopping item
 *
 * Requirements:
 * - loggedIn
 * - shopping item must exist
 * - Protagonist and owner must be member of the household that belongs to the shopping item
 */
exports.shoppingItemUpdate = function(req, res) {
	if(req.session.loggedIn) {
		
		validateShoppingItem(req);
		req.checkBody('id').isInt();
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
	
		var form = {
			id : req.sanitize('id').toInt()
		};
		sanitizeShoppingItem(req, form);
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shoppingItemUpdate', err);
			}
			
			client.query(
				'SELECT is_household_member(get_household_id_by_shopping_item_id($1), $2) as is_member, ' +
				'is_household_member(get_household_id_by_shopping_item_id($1), $3) as owner_is_member',	
				[form.id, req.session.personId, form.owner], function(err, result) {
			
				if(err) {
					done();
					return console.error('Failed to load membership data in shoppingItemUpdate', err);
				}
				
				if(result.rows[0].is_member === false) {
					done();
					res.redirect('/internal_error?not_member');
					return;
				}
				
				if(result.rows[0].owner_is_member === false) {
					done();
					res.redirect('/internal_error?owner_not_member');
					return;
				}
				
				client.query('UPDATE shopping_item SET name=$1, owner_person_id=$2, price=$3 WHERE id=$4',
					[form.name, form.owner, form.price, form.id], function(err, result) {
				
					done();
				
					if(err) {
						return console.error('Failed to update shopping item', err);
					}
					
					if(result.rowCount !== 1) {
						return console.error('Failed to find shopping item.', err);
					}
					
					res.redirect('/shopping_item/' + form.id);
				});
			});
		});	
	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for deleting shopping items.
 *
 * Parameter:
 * - id int: ID of the shopping item
 *
 * Requirements:
 * - loggedIn
 * - shopping item must exist
 * - Protagonist must be member of the household that belongs to the shopping item
 */
exports.shoppingItemDelete = function(req, res) {
	if(req.session.loggedIn) {

		req.checkBody('id').isInt();

		var errors = req.validationErrors();
		
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		var form = {
			id : req.sanitize('id').toInt()
		};
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shoppingItemDelete', err);
			}
			
			client.query(
				'SELECT is_household_member(get_household_id_by_shopping_item_id($1), $2) as is_member',
				[form.id, req.session.personId], function(err, result) {
				
				if(err) {
					return console.error('Failed to check membership', err);
				}
				
				if(! result.rows[0].is_member) {
					res.redirect('/internal_error?not_member');
					return;
				}
				
				client.query(
					'DELETE FROM shopping_item WHERE id=$1 RETURNING shopping_list_id',
					[form.id], function(err, result) {
				
					done();
				
					if(err) {
						return console.error('Failed to delete shopping item', err);
					}
					
					if(result.rowCount !== 1) {
						res.redirect('/internal_error?not_found');
						return;
					}
					
					res.redirect('/shopping_list/' + result.rows[0].shopping_list_id);
				});
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};
