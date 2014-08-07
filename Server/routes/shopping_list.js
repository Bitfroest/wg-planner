var async = require('async');

var formatEuro = require('../utils/currency_formatter.js').formatEuro;
var formatDate = require('../utils/date_formatter.js').formatDate;

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
			
			client.query('SELECT EXISTS (SELECT 1 FROM household_member WHERE household_id=$1 AND person_id=$2 LIMIT 1) AS is_member, ' +
				'EXISTS (SELECT 1 FROM household_member WHERE household_id=$1 AND person_id=$3 LIMIT 1) AS buyer_is_member',
				[form.household, req.session.personId, form.buyer], function(err, result) {
			
				if(err) {
					return console.error('Failed to check if household member', err);
				}
				
				if(result.rows.length == 0 || result.rows[0].is_member == false) {
					res.redirect('/internal_error?not_member');
					return;
				}
				
				if(result.rows[0].buyer_is_member == false) {
					res.redirect('/internal_error?buyer_not_member');
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

exports.shoppingList = function(req, res) {
	if(req.session.loggedIn) {
		
		req.checkParams('id').isInt();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		req.sanitize('id').toInt();
		
		var form = {
			shoppingListId : parseInt(req.params.id)
		};
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in shoppingList');
			}
			
			client.query(
				'SELECT l.shop_name AS shop_name, bp.name AS buyer_name, cp.name AS creator_name, l.created AS created, ' +
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
				
				if(result.rows.length == 0) {
					res.redirect('/internal_error?error=shopping_list_not_found');
					return;
				}
				
				if(result.rows[0].is_member == false) {
					res.redirect('/internal_error?error=not_a_member');
				}
				
				form.shoppingListInfo = result.rows[0];
				
				async.series({
					items : client.query.bind(client,
						'SELECT i.name AS name, p.name as owner_name, i.price AS price ' +
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
						_csrf: req.csrfToken()
					});
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};