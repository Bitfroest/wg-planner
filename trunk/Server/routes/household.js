var async = require('async');
var formatEuro = require('../utils/currency_formatter.js').formatEuro;
var formatDate = require('../utils/date_formatter.js').formatDate;

function validateHousehold(req) {
	req.checkBody('name').isLength(3, 30);
}

function sanitizeHousehold(req, form) {
	form.name = req.sanitize('name').toString();
}

/*
 * Router for displaying a single household.
 *
 * Parameter:
 * - id int: ID of the household that should be displayed
 *
 * Requirements:
 * - loggedIn
 * - Protagonist must be member of the household
 */
exports.household = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkParams('id').isInt();
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
	
		var form = {
			householdId : req.sanitize('id').toInt()
		};
	
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.household');
			}
			
			client.query('SELECT h.name AS name, m.person_id IS NOT NULL AS is_member, m.role AS role ' +
				'FROM household h LEFT JOIN household_member m ON(h.id=m.household_id AND m.person_id=$1) ' +
				'WHERE h.id = $2', [req.session.personId, form.householdId], function(err, result) {
			
				if(err) {
					return console.error('Could not load name of household', err);
				}
			
				if(result.rows.length == 0) {
					done();
					res.redirect('/internal_error=household_not_found');
					return;
				}
			
				// you are not member of this household --> do not give him any information
				if(!result.rows[0].is_member) {
					done();
					res.redirect('/internal_error?error=not_a_member');
					return;
				}
				
				form.householdName = result.rows[0].name;
				form.householdRole = result.rows[0].role;
			
				async.series({
					members: client.query.bind(client,
						'SELECT p.id AS id, p.name AS name, p.email AS email, m.role as role ' +
						'FROM person p JOIN household_member m ON (p.id=m.person_id) WHERE m.household_id=$1 ' +
						'ORDER BY p.id ASC',
						[form.householdId]),
					invitations: client.query.bind(client,
						'SELECT p.id AS to_person_id, p.name AS to_person_name ' +
						'FROM household_invitation i JOIN person p ON (i.to_person_id = p.id) ' +
						'WHERE i.household_id = $1',
						[form.householdId]),
					shoppingLists: client.query.bind(client,
						'SELECT l.id AS id, p.name AS person_name, l.shopped AS shopped, l.shop_name AS shop_name, ' +
						'(SELECT coalesce(sum(i.price),0) FROM shopping_item i WHERE i.shopping_list_id = l.id) AS total ' +
						'FROM shopping_list l JOIN person p ON (p.id=l.buyer_person_id) ' +
						'WHERE l.household_id=$1 ORDER BY l.shopped DESC', [form.householdId]),
					debtsMatrix : client.query.bind(client,
						'SELECT * FROM household_debts_matrix($1)',
						[form.householdId]),
					debtsSummary : client.query.bind(client,
						'SELECT * FROM household_debts_summary($1)',
						[form.householdId])
				}, function(err, result) {
					done();
					
					if(err) {
						return console.error('Could not load members of household', err);
					}
					
					res.render('household', {
						_csrf: req.csrfToken(),
						members: result.members.rows,
						invitations: result.invitations.rows,
						shoppingLists: result.shoppingLists.rows,
						household: form.householdId,
						householdName : form.householdName,
						householdRole : form.householdRole,
						debtsMatrix : result.debtsMatrix.rows,
						debtsSummary : result.debtsSummary.rows,
						title: 'Haushalt ' + form.householdName,
						formatCurrency : formatEuro,
						formatCurrency2 : function(x) { if(x === "0" || x === 0) return '-'; else return formatEuro(x); },
						formatDate : formatDate,
						breadcrumbs : [{url: '/household/' + form.householdId, text: 'Haushalt'}]
					});
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for creating households.
 * It will also create a membership association between
 * the protagonist and the newly created household.
 * 
 * Parameter:
 * - name string: name of the household
 * 
 * Requirements:
 * - loggedIn
 */
exports.householdCreate = function(req, res) {
	if(req.session.loggedIn) {
		
		validateHousehold(req);
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		var form = {};
		sanitizeHousehold(req, form);
		
		req.getDb(function(err, client, done){
			if(err) {
				return console.error('Failed to connect in customer.householdCreate', err);
			}
			
			client.query('INSERT INTO household(name, created) VALUES($1, $2) RETURNING id',
				[form.name, new Date()], function(err, result){
				
				if(err) {
					return console.error('Failed to insert household', err);
				}
				
				var householdId = result.rows[0].id;
				
				client.query('INSERT INTO household_member(household_id,person_id,role,created) VALUES ($1,$2,$3,$4)',
					[householdId, req.session.personId, 'founder', new Date()], function(err, result){
				
					done();
					
					if(err) {
						return console.error('Failed to insert household_member', err);
					}
					
					res.redirect('/household/' + householdId);
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};

/*
 * Router for updating households.
 *
 * Parameter:
 * - id int: ID of the household
 * - name string: name of the household
 *
 * Requirements
 * - loggedIn
 * - household must exist
 * - Protagonist must be founder of the household
 */
exports.householdUpdate = function(req, res) {
	if(req.session.loggedIn) {
		
		req.checkBody('id').isInt();
		validateHousehold(req);
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		var form = {
			id : req.sanitize('id').toInt()
		};
		sanitizeHousehold(req, form);
		
		req.getDb(function(err, client, done) {
			if(err) {
				console.error('Failed to connect in householdUpdate', err);
				return;
			}
			
			client.query('SELECT role FROM household_member WHERE person_id=$1 AND household_id=$2 LIMIT 1',
				[req.session.personId, form.id], function(err, result) {
				
				if(err) {
					console.error('Failed to load household_member', err);
					return;
				}
				
				if(result.rows.length == 0) {
					res.redirect('/internal_error?not_member');
					return;
				}
				
				if(result.rows[0].role !== 'founder') {
					res.redirect('/internal_error?not_founder');
					return;
				}
				
				client.query('UPDATE household SET name=$1 WHERE id=$2', [form.name, form.id], function(err, result) {
					done();
					
					if(err) {
						console.error('Failed to update household', err);
						return;
					}
					
					res.redirect('/household/' + form.id);
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};