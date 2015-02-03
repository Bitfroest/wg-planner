var errors = require('../api-errors');
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

module.exports = function (req, res, opt) {
	if(!req.session.loggedIn) {
		errors.loggedIn(res);
		return;
	}
	
	validateShoppingItem(req, true);
	req.checkBody('shopping_list').isInt();

	var err = req.validationErrors();

	if(err) {
		errors.validation(res, err);
		return;
	}

	var form = {
		shoppingList : req.sanitize('shopping_list').toInt()
	};
	sanitizeShoppingItem(req, form, true);
	
	var queries = [];
	
	queries.push(opt.client.query.bind(opt.client,
		'SELECT is_household_member(get_household_id_by_shopping_list_id($1), $2) AS is_member',
		[form.shoppingList, req.session.personId]
	));
	
	for(var i = 0; i < form.owner.length; i++) {
		queries.push(opt.client.query.bind(opt.client,
			'SELECT is_household_member(get_household_id_by_shopping_list_id($1), $2) AS is_member',
			[form.shoppingList, form.owner[i]]
		));
	}
	
	async.series(queries, function(err, result) {
		if(err) {
			errors.query(res, err);
			return;
		}
		
		var i;
		
		for(i = 0; i < result.length; i++) {
			if(! result[i].rows[0].is_member) {
				errors.custom(res, result[i].rows[0]);
				return;
			}
		}
		
		
		// TODO preis durch anzahl owner teilen
		form.price = Math.ceil(form.price/form.owner.length);
		
		var queries = [];
		
		for(i = 0; i < form.owner.length; i++) {
			queries.push(opt.client.query.bind(opt.client,
				'INSERT INTO shopping_item (name, shopping_list_id, owner_person_id, price) VALUES ($1,$2,$3,$4)',
				[form.name, form.shoppingList, form.owner[i], form.price]
			));
		}
		
		async.series(queries, function(err) {		
			if(err) {
				errors.query(res, err);
			}
			
			res.json({
				success : true
			});
		});
	});
};