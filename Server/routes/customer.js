var async = require('async');

exports.main = function(req, res) {
	if(req.session.loggedIn) {
		res.render('main', {title : 'Übersicht'});
	} else {
		res.redirect('/sid_wrong');
	}
};

exports.household = function(req, res) {
	if(req.session.loggedIn) {
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.household', err);
			}
			
			async.series({
				households : client.query.bind(client, 'SELECT h.id AS id, h.name AS name FROM household h ' +
					'JOIN household_member m ON (h.id = m.household_id) WHERE m.person_id = $1', [req.session.personId]),
				invitationsToMe : client.query.bind(client, 'SELECT p.name as person_name, h.name as household_name ' +
					'FROM household_invitation i JOIN person p ' +
					'ON (i.from_person_id = p.id) JOIN household h ON (i.household_id = h.id) WHERE i.to_person_id = $1',
					[req.session.personId]),
				invitationsFromMe : client.query.bind(client, 'SELECT p.name as person_name, h.name as household_name ' +
					'FROM household_invitation i JOIN person p ' +
					'ON (i.to_person_id = p.id) JOIN household h ON (i.household_id = h.id) WHERE i.from_person_id = $1',
					[req.session.personId])
			}, function(err, result){
				done();
				
				if(err) {
					return console.error('Failed to load households by person', err);
				}
				
				res.render('household', {
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
	
		var form = {
			householdId: parseInt(req.body.household),
			email: '' + req.body.email
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
			
				// if there is an entry the current user is a member of this household
				if(result.rows.length == 1) {
					
					// now get the id of the person with the given email
					client.query('SELECT id FROM person WHERE email = $1', [form.email], function(err, result) {
						
						if(err) {
							return console.error('Failed to get person.id by email');
						}
					
						if(result.rows.length == 1) {
							client.query('INSERT INTO household_invitation(household_id,from_person_id,to_person_id,created) VALUES($1,$2,$3,$4)',
								[form.householdId, req.session.personId, result.rows[0].id, new Date()], function(err, result) {
								
								done();
								
								if(err) {
									return console.error('Could not insert new invitation', err);
								}
								
								res.redirect('/household?success=true');
								
							});
						} else {
							console.error('Could not find person by email');
						}
					});
					
				} else {
					console.error('Cannot create an invitation: Not a member of the household!');
				}
			});
		});

	} else {
		res.redirect('/sid_wrong');
	}
};