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
			
			client.query('SELECT h.id AS id, h.name AS name FROM household h ' +
				'JOIN household_member m ON (h.id = m.household_id) WHERE m.person_id = $1', [req.session.personId],
				function(err, result){
			
				done();
				
				if(err) {
					return console.error('Failed to load households by person', err);
				}
				
				res.render('household', {households: result.rows});
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