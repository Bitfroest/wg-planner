var async = require('async');
var formatEuro = require('../utils/currency_formatter.js').formatEuro;

/*
 * Router for displaying the customer dashboard.
 *
 * Parameter: none
 *
 * Requirements:
 * - loggedIn
 */
exports.dashboard = function(req, res) {
	if(req.session.loggedIn) {
		
		req.getDb(function(err, client, done) {
			if(err) {
				return console.error('Failed to connect in customer.householdOverview', err);
			}
			
			async.series({
				person : client.query.bind(client, 'SELECT name, email, role, id FROM person WHERE id=$1', [req.session.personId]),
				households : client.query.bind(client, 'SELECT h.id AS id, household_my_total(id,$1) AS total, h.name AS name, m.role AS role, ' +
					'(SELECT string_agg(p.name, $2) FROM household_member all_m ' +
						'JOIN person p ON (all_m.person_id=p.id) WHERE all_m.household_id= h.id) AS members ' +
					'FROM household h ' +
					'JOIN household_member m ON (h.id = m.household_id) WHERE m.person_id = $1', [req.session.personId, ', ']),
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
				
				res.render('dashboard', {
					_csrf: req.csrfToken(),
					person : result.person.rows[0],
					households: result.households.rows,
					invitationsToMe: result.invitationsToMe.rows,
					invitationsFromMe: result.invitationsFromMe.rows,
					title: 'Haushalte',
					formatCurrency : formatEuro,
					breadcrumbs : []
				});
			});
		});
		
	} else {
		res.redirect('/sid_wrong');
	}
};
