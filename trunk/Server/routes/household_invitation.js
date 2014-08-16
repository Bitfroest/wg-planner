exports.householdInvitationCreate = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household', 'Haushalt auswählen').isInt();
		req.checkBody('email', 'Mail-Adresse hat ungültiges Format').isEmail();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/dashboard?error=true');
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
							res.redirect('/household/' + form.householdId + '?error=send_inv_to_myself');
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
								res.redirect('/household/' + form.householdId + '?error=has_already_invitation');
								return;
							}
					
							// if the person is already member
							if(result.rows[0].mem) {
								res.redirect('/household/' + form.householdId + '?error=is_already_member');
								return;
							}
					
							client.query('INSERT INTO household_invitation(household_id,from_person_id,to_person_id,created) VALUES($1,$2,$3,$4)',
								[form.householdId, req.session.personId, form.toPersonId, new Date()], function(err, result) {
								
								done();
								
								if(err) {
									return console.error('Could not insert new invitation', err);
								}
								
								res.redirect('/household/' + form.householdId + '?success=true');
								
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
			res.redirect('/dashboard?error=true');
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
					res.redirect('/dashboard?error=inv_not_found');
					return;
				}
				
				client.query('INSERT INTO household_member(household_id,person_id,role,created) VALUES($1,$2,$3,$4)',
					[form.household, req.session.personId, 'member', new Date()], function(err, result) {
				
					done();
				
					if(err) {
						return console.error('Failed to insert new member', err);
					}
				
					res.redirect('/dashboard?success=true');
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
			res.redirect('/dashboard?error=true');
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
					res.redirect('/dashboard?error=inv_not_found');
					return;
				}
			
				res.redirect('/dashboard?success=true');
			
			});
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
};

// used on /dashboard page
exports.householdInvitationCancel = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household').isInt();
		req.checkBody('to_person').isInt();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/dashboard?error=true');
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
					return console.error('Failed to cancel invitation', err);
				}
				
				if(result.rowCount == 0) {
					res.redirect('/dashboard?error=inv_not_found');
					return;
				}
				
				res.redirect('/dashboard?success=true');
			});
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
};

// used on /household/[id] page
exports.householdInvitationCancel2 = function(req, res) {
	if(req.session.loggedIn) {
	
		req.checkBody('household').isInt();
		req.checkBody('to_person').isInt();
		
		var errors = req.validationErrors();
	
		if(errors) {
			res.redirect('/dashboard?error=true');
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
				return console.error('Failed to connect in householdInvitationCancel2', err);
			}
			
			client.query('SELECT role FROM household_member WHERE household_id=$1 AND person_id=$2 LIMIT 1',
				[form.household, req.session.personId], function(err, result) {
			
				if(err) {
					return console.error('Could not check membership', err);
				}
				
				if(result.rows.length == 0) {
					res.redirect('/household/' + form.household + '?not_member');
					return;
				}
				
				if(result.rows[0].role !== 'founder') {
					res.redirect('/household/' + form.household + '?not_founder');
					return;
				}
			
				client.query('DELETE FROM household_invitation WHERE to_person_id=$1 AND household_id=$2',
					[form.toPerson, form.household], function(err, result) {
					
					done();
					
					if(err) {
						return console.error('Failed to cancel invitation', err);
					}
					
					if(result.rowCount == 0) {
						res.redirect('/household/' + form.household + '?error=inv_not_found');
						return;
					}
					
					res.redirect('/household' + form.household + '?success=true');
				});
			});
		});
	
	} else {
		res.redirect('/sid_wrong');
	}
};