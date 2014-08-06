var async = require('async');
var formatEuro = require('../utils/currency_formatter.js').formatEuro;
var formatDate = require('../utils/date_formatter.js').formatDate;

exports.main = function(req, res) {
	if(req.session.loggedIn) {
		res.render('main', {title : 'Übersicht'});
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.household = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkParams('id').isInt();
	
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/internal_error');
			return;
		}
		
		req.sanitize('id').toInt();
	
		var form = {
			householdId : req.params.id
		};
	
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.household');
			}
			
			client.query('SELECT h.name AS name, m.person_id IS NOT NULL AS is_member ' +
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
			
				async.series({
					members: client.query.bind(client,
						'SELECT p.id AS id, p.name AS name, p.email AS email, m.role as role ' +
						'FROM person p JOIN household_member m ON (p.id=m.person_id) WHERE m.household_id=$1',
						[form.householdId]),
					shoppingLists: client.query.bind(client,
						'SELECT l.id AS id, p.name AS person_name, l.shopped AS shopped, l.shop_name AS shop_name, ' +
						'(SELECT coalesce(sum(i.price),0) FROM shopping_item i WHERE i.shopping_list_id = l.id) AS total ' +
						'FROM shopping_list l JOIN person p ON (p.id=l.buyer_person_id) ' +
						'WHERE l.household_id=$1 ORDER BY l.shopped DESC', [form.householdId])
				}, function(err, result) {
					done();
					
					if(err) {
						return console.error('Could not load members of household', err);
					}
					
					res.render('show-household', {
						_csrf: req.csrfToken(),
						members: result.members.rows,
						shoppingLists: result.shoppingLists.rows,
						household: form.householdId,
						title: 'Haushalt ' + form.householdName,
						formatCurrency : formatEuro,
						formatDate : formatDate
					});
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.householdOverview = function(req, res) {
	if(req.session.loggedIn) {
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.householdOverview', err);
			}
			
			async.series({
				households : client.query.bind(client, 'SELECT h.id AS id, h.name AS name, m.role AS role FROM household h ' +
					'JOIN household_member m ON (h.id = m.household_id) WHERE m.person_id = $1', [req.session.personId]),
				invitationsToMe : client.query.bind(client, 'SELECT p.name as person_name, h.name as household_name, h.id as household_id ' +
					'FROM household_invitation i JOIN person p ' +
					'ON (i.from_person_id = p.id) JOIN household h ON (i.household_id = h.id) WHERE i.to_person_id = $1',
					[req.session.personId]),
				invitationsFromMe : client.query.bind(client, 'SELECT p.name as person_name, h.name as household_name, '+
					'h.id as household_id, p.id as to_person_id ' +
					'FROM household_invitation i JOIN person p ' +
					'ON (i.to_person_id = p.id) JOIN household h ON (i.household_id = h.id) WHERE i.from_person_id = $1',
					[req.session.personId])
			}, function(err, result){
				done();
				
				if(err) {
					return console.error('Failed to load households by person', err);
				}
				
				res.render('household', {
					_csrf: req.csrfToken(),
					households: result.households.rows,
					invitationsToMe: result.invitationsToMe.rows,
					invitationsFromMe: result.invitationsFromMe.rows,
					title: 'Haushalte'
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.householdCreate = function(req, res) {
	if(req.session.loggedIn) {
		
		req.getDb(function(err, client, done){
			if(err) {
				return console.error('Failed to connect in customer.householdCreate', err);
			}
			
			client.query('INSERT INTO household(name, created) VALUES($1, $2) RETURNING id',
				[req.body.name, new Date()], function(err, result){
				
				if(err) {
					return console.error('Failed to insert household', err);
				}
				
				client.query('INSERT INTO household_member(household_id,person_id,role,created) VALUES ($1,$2,$3,$4)',
					[result.rows[0].id, req.session.personId, 'founder', new Date()], function(err, result){
				
					done();
					
					if(err) {
						return console.error('Failed to insert household_member', err);
					}
					
					res.redirect('/household');
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.householdInvitationCreate = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household', 'Haushalt auswählen').isInt();
		req.checkBody('email', 'Mail-Adresse hat ungültiges Format').isEmail();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/household?error=true');
			return;
		}
	
		req.sanitize('household').toInt();
		req.sanitize('email').toString();
	
		var form = {
			householdId: req.body.household,
			email: req.body.email
		};
	
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.householdInvitationCreate', err);
			}
			
			// check if the current user is member of the household he wants to send an invitation from
			client.query('SELECT role FROM household_member WHERE person_id = $1 AND household_id = $2',
				[req.session.personId, form.householdId], function(err, result) {
			
				if(err) {
					return console.error('Failed to find household_member', err);
				}
			
				// if there is an entry the current user is the founder of this household
				if(result.rows.length == 1 && result.rows[0].role === 'founder') {
					
					// now get the id of the person with the given email
					client.query('SELECT id FROM person WHERE email = $1', [form.email], function(err, result) {
						
						if(err) {
							return console.error('Failed to get person.id by email', err);
						}
					
						if(result.rows.length != 1) {
							return console.error('Could not find person by email');
						}
						
						form.toPersonId = parseInt(result.rows[0].id);
						
						// tried to invite myself
						if(form.toPersonId == req.session.personId) {
							res.redirect('/household?error=send_inv_to_myself');
							return;
						}
						
						// check if there is already an invitation for the given household and target person
						client.query('SELECT '
							+ 'EXISTS (SELECT 1 FROM household_invitation WHERE to_person_id=$1 AND household_id=$2 LIMIT 1) AS inv,'
							+ 'EXISTS (SELECT 1 FROM household_member WHERE person_id=$1 AND household_id=$2 LIMIT 1) AS mem',
							[form.toPersonId, form.householdId], function(err, result){
						
							if(err) {
								return console.error('Failed to load existing invitations and/or membership', err);
							}
							
							console.info(result.rows);
							
							// if there is an invitation then error
							if(result.rows[0].inv) {
								res.redirect('/household?error=has_already_invitation');
								return;
							}
					
							// if the person is already member
							if(result.rows[0].mem) {
								res.redirect('/household?error=is_already_member');
								return;
							}
					
							client.query('INSERT INTO household_invitation(household_id,from_person_id,to_person_id,created) VALUES($1,$2,$3,$4)',
								[form.householdId, req.session.personId, form.toPersonId, new Date()], function(err, result) {
								
								done();
								
								if(err) {
									return console.error('Could not insert new invitation', err);
								}
								
								res.redirect('/household?success=true');
								
							});
						});
					});
					
				} else {
					console.error('Cannot create an invitation: Not the founder of the household!');
				}
			});
		});

	} else {
		res.redirect('/sid_wrong');
	}
};

exports.householdInvitationAccept = function(req, res) {
	if(req.session.loggedIn) {
		
		req.checkBody('household').isInt();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/household?error=true');
			return;
		}
		
		req.sanitize('household').toInt();
		
		var form = {
			household : req.body.household
		};
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in householdInvitationAccept', err);
			}
			
			// check if there is an invitation for the given household
			client.query('DELETE FROM household_invitation WHERE to_person_id=$1 AND household_id=$2',
				[req.session.personId, form.household], function(err, result) {
			
				if(err) {
					return console.error('Failed to delete existing invitation', err);
				}
				
				// if there is no such invitation
				if(result.rowCount == 0) {
					res.redirect('/household?error=inv_not_found');
					return;
				}
				
				client.query('INSERT INTO household_member(household_id,person_id,role,created) VALUES($1,$2,$3,$4)',
					[form.household, req.session.personId, 'member', new Date()], function(err, result) {
				
					done();
				
					if(err) {
						return console.error('Failed to insert new member', err);
					}
				
					res.redirect('/household?success=true');
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.householdInvitationDecline = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household').isInt();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/household?error=true');
			return;
		}
		
		req.sanitize('household').toInt();
		
		var form = {
			household : req.body.household
		};
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in householdInvitationDecline', err);
			}
			
			client.query('DELETE FROM household_invitation WHERE to_person_id=$1 AND household_id=$2',
				[req.session.personId, form.household], function(err, result) {
			
				done();
			
				if(err) {
					return console.error('Failed to decline invitation', err);
				}
				
				if(result.rowCount == 0) {
					res.redirect('/household?error=inv_not_found');
					return;
				}
			
				res.redirect('/household?success=true');
			
			});
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.householdInvitationCancel = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household').isInt();
		req.checkBody('to_person').isInt();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/household?error=true');
			return;
		}
		
		req.sanitize('household').toInt();
		req.sanitize('to_person').toInt();
		
		var form = {
			household : req.body.household,
			toPerson : req.body.to_person
		};
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in householdInvitationCancel', err);
			}
			
			client.query('DELETE FROM household_invitation WHERE from_person_id=$1 AND to_person_id=$2 AND household_id=$3',
				[req.session.personId, form.toPerson, form.household], function(err, result) {
				
				done();
				
				if(err) {
					return console.error('Failed to accept invitation', err);
				}
				
				if(result.rowCount == 0) {
					res.redirect('/household?error=inv_not_found');
					return;
				}
				
				res.redirect('/household?success=true');
			});
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
};