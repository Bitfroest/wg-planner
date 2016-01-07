var async = require('async');

var formatEuro = require('../utils/currency_formatter.js').formatEuro;
var formatDate = require('../utils/date_formatter.js').formatDate;

function validateShoppingList(req) {
	req.checkBody('buyer').isInt();
	req.checkBody('shop').isLength(1, 30);
	req.checkBody('shopped_date').matches(/^[0-3]?[0-9]\.[01]?[0-9]\.[0-9]{4}$/);
	req.checkBody('shopped_time').matches(/^[0-2]?[0-9]:[0-5]?[0-9]$/);
}

function sanitizeShoppingList(req, form) {
	var dateParts = req.sanitize('shopped_date').toString().split('.');
	var timeParts = req.sanitize('shopped_time').toString().split(':');

	form.buyer = req.sanitize('buyer').toInt();
	form.shop = req.sanitize('shop').toString();
	form.shopped = new Date(dateParts[2], dateParts[1]-1, dateParts[0], timeParts[0], timeParts[1]);
		// year, month, day, hour, minute, second, millisecond
}

/*
 * Router for creating new shopping lists.
 *
 * Parameter:
 * - household int: ID of the household that will be parent for the new shopping list
 * - buyer int: ID of the person who bought all the things on the list
 * - shop string: Name of the shop where the shopping was done
 * - shopped_date string: When the shopping was done (only date), Format: "DD.MM.YYYY"
 * - shopped_time string: When the shopping was done (only time), Format: "HH:MM"
 *
 * Requirements:
 * - loggedIn
 * - Protagonist and buyer must be member of the household
 */
exports.shoppingListCreate = function(req, res) {
	if(req.session.loggedIn) {

		req.checkBody('household').isInt();
		validateShoppingList(req);

		var errors = req.validationErrors();

		if(errors) {
			res.redirect('/internal_error');
			return;
		}

		var form = {
			household : req.sanitize('household').toInt()
		};
		sanitizeShoppingList(req, form);

		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.household');
			}

			client.query(
				'SELECT is_household_member($1, $2) AS is_member, ' +
				'is_household_member($1, $3) AS buyer_is_member',
				[form.household, req.session.personId, form.buyer], function(err, result) {

				if(err) {
					return console.error('Failed to check if household member', err);
				}

				if(result.rows.length === 0 || result.rows[0].is_member === false) {
					res.redirect('/internal_error?not_member');
					return;
				}

				if(result.rows[0].buyer_is_member === false) {
					res.redirect('/internal_error?buyer_not_member');
					return;
				}

				client.query('INSERT INTO shopping_list(shop_name,household_id,buyer_person_id,creator_person_id,shopped,created)' +
					' VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
					[form.shop, form.household, form.buyer, req.session.personId, form.shopped, new Date()], function(err, result) {

					if(err) {
						done();
						return console.error('Failed to insert new shopping_list', err);
					}

					var listId = result.rows[0].id;

					if(req.file) {
						console.log('Has file');
						client.query('INSERT INTO shopping_list_receipt(shopping_list_id,file,created,status)' +
						' VALUES($1,$2,$3,$4)', [listId, req.file.path, new Date(), 0], function(err, result) {
							done();

							if(err) {
								return console.error('Failed to insert new shopping_list_receipt', err);
							} else {
								res.redirect('/shopping_list/' + listId);
							}
						});
					} else {
						console.log('NO FILE :(');
						res.redirect('/shopping_list/' + listId);
						done();
					}
				});
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for displaying a single shopping list.
 *
 * Parameter:
 * - id int: ID of the shopping list that should be displayed
 *
 * Requirements:
 * - loggedIn
 * - shopping list must exist
 * - Protagonist must be member of the household that belongs to the shopping list
 */
exports.shoppingList = function(req, res) {
	if(req.session.loggedIn) {

		req.checkParams('id').isInt();

		var errors = req.validationErrors();

		if(errors) {
			res.redirect('/internal_error');
			return;
		}

		var form = {
			shoppingListId : req.sanitize('id').toInt()
		};

		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shoppingList');
			}

			client.query(
				'SELECT l.shop_name AS shop_name, bp.id AS buyer_id, bp.name AS buyer_name, cp.name AS creator_name, l.created AS created, ' +
				'h.name AS household_name, l.household_id AS household_id, l.shopped AS shopped, m.role IS NOT NULL AS is_member, ' +
				'l.id AS id, ' +
				'(SELECT coalesce(sum(i.price), 0) FROM shopping_item i WHERE i.shopping_list_id= $2) AS total_price ' +
				'FROM shopping_list l ' +
				'LEFT JOIN person bp ON (l.buyer_person_id=bp.id) ' +
				'LEFT JOIN person cp ON (l.creator_person_id=cp.id) ' +
				'LEFT JOIN household h ON (l.household_id=h.id) ' +
				'LEFT JOIN household_member m ON (m.household_id=l.household_id AND m.person_id= $1) ' +
				'WHERE l.id = $2',
				[req.session.personId, form.shoppingListId],
				function(err, result) {

				if(err) {
					return console.error('Could not load shopping list information', err);
				}

				if(result.rows.length === 0) {
					res.redirect('/internal_error?error=shopping_list_not_found');
					return;
				}

				if(result.rows[0].is_member === false) {
					res.redirect('/internal_error?error=not_a_member');
				}

				form.shoppingListInfo = result.rows[0];

				async.series({
					items : client.query.bind(client,
						'SELECT i.id AS id, i.name AS name, p.name as owner_name, i.price AS price ' +
						'FROM shopping_item i ' +
						'LEFT JOIN person p ON (i.owner_person_id=p.id) ' +
						'WHERE i.shopping_list_id = $1 ',
						[form.shoppingListId]),
					stats : client.query.bind(client,
						'SELECT (SELECT name FROM person WHERE id = owner_person_id) AS name, ' +
						'sum(price) AS total FROM shopping_item ' +
						'WHERE shopping_list_id=$1 GROUP BY owner_person_id',
						[form.shoppingListId]),
					members : client.query.bind(client,
						'SELECT p.id AS id, p.name AS name ' +
						'FROM shopping_list l ' +
						'JOIN household_member m ON (l.household_id=m.household_id) ' +
						'JOIN person p ON (m.person_id=p.id) ' +
						'WHERE l.id=$1',
						[form.shoppingListId])
				},
				function(err, result) {
					done();

					if(err) {
						return console.error('Failed to load shopping items or stats', err);
					}

					res.render('shopping_list', {
						shoppingList : form.shoppingListInfo,
						shoppingItems : result.items.rows,
						stats : result.stats.rows,
						members : result.members.rows,
						title : 'Einkaufsliste',
						formatDate : formatDate,
						formatCurrency : formatEuro,
						_csrf: req.csrfToken(),
						breadcrumbs: [
							{url: '/household/' + form.shoppingListInfo.household_id, text: 'Haushalt'},
							{url: '/shopping_list/' + form.shoppingListInfo.id, text: 'Einkaufsliste'}
						]
					});
				});
			});
		});

	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for updating shopping lists.
 *
 * Parameter:
 * - id int: ID of the shopping list
 * - buyer int: ID of the buyer person (will be changed)
 * - shop string: Name of the shop (will be changed)
 * - shopped_date string: When the shopping was done, Format "DD.MM.YYYY" (will be changed)
 * - shopped_time string: When the shopping was done, Format "HH:MM" (will be changed)
 *
 * Requirements:
 * - loggedIn
 * - shopping list must exist
 * - Protagonist must be member of the household that belongs to the shopping list
 * - buyer must be member of the household that belongs to the shopping list
 */
exports.shoppingListUpdate = function(req, res) {
	if(req.session.loggedIn) {

		req.checkBody('id').isInt();
		validateShoppingList(req);

		var errors = req.validationErrors();

		if(errors) {
			res.redirect('/internal_error');
			return;
		}

		var form = {
			id : req.sanitize('id').toInt()
		};
		sanitizeShoppingList(req, form);

		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.household');
			}

			client.query(
				'SELECT is_household_member(get_household_id_by_shopping_list_id($1), $2) AS is_member, ' +
				'is_household_member(get_household_id_by_shopping_list_id($1), $3) AS buyer_is_member',
				[form.id, req.session.personId, form.buyer], function(err, result) {

				if(err) {
					return console.error('Failed to check if household member', err);
				}

				if(result.rows[0].is_member === false) {
					res.redirect('/internal_error?not_member');
					return;
				}

				if(result.rows[0].buyer_is_member === false) {
					res.redirect('/internal_error?buyer_not_member');
					return;
				}

				client.query('UPDATE shopping_list SET buyer_person_id=$1, shop_name=$2, shopped=$3 WHERE id=$4',
					[form.buyer, form.shop, form.shopped, form.id], function(err, result) {

					done();

					if(err) {
						return console.error('Failed to update shopping_list', err);
					}

					if(result.rowCount !== 1) {
						return console.error('Failed to find shopping list', err);
					}

					res.redirect('/shopping_list/' + form.id);
				});
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for deleting shopping lists.
 *
 * Parameter:
 * - id int: ID of the shopping list
 *
 * Requirements:
 * - loggedIn
 * - shopping list must exist
 * - Protagonist must be member of the household that belongs to the shopping list
 */
exports.shoppingListDelete = function(req, res) {
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
				return console.error('Failed to connect in customer.household');
			}

			client.query(
				'SELECT is_household_member(get_household_id_by_shopping_list_id($1), $2) AS is_member',
				[form.id, req.session.personId],
				function(err, result) {

				if(err) {
					return console.error('Failed to load membership data', err);
				}

				if(! result.rows[0].is_member) {
					res.redirect('/internal_error?not_member');
					return;
				}

				client.query('DELETE FROM shopping_item WHERE shopping_list_id=$1', [form.id], function(err) {
					if(err) {
						return console.error('Failed to delete depending shopping items', err);
					}

					client.query('DELETE FROM shopping_list WHERE id=$1 RETURNING household_id', [form.id], function(err, result) {
						done();

						if(err) {
							return console.error('Failed to delete shopping list', err);
						}

						if(result.rowCount !== 1) {
							res.redirect('/internal_error?not_found');
							return;
						}

						res.redirect('/household/' + result.rows[0].household_id);
					});
				});
			});
		});
	} else {
		res.redirect('/sid_wrong');
	}
};
