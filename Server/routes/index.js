/*
 * Router
 *
 * Routes all URLs to a specific controller.
 * The router can differentiate between GET, POST and all the other REST methods.
 */

var publicRouter = require('./public');
var dashboardRouter = require('./dashboard');
var householdRouter = require('./household');
var householdInvitationRouter = require('./household_invitation');
var shoppingListRouter = require('./shopping_list');
var shoppingItemRouter = require('./shopping_item');
var notificationRouter = require('./notification');
var settingsRouter = require('./settings');
var invitationRouter = require('./invitation');

var apiRouter = require('./api');

module.exports = function(app) {

	//index page
	app.get('/', publicRouter.index);

	//login page
	app.get('/login', publicRouter.login);

	//logout
	app.post('/logout', publicRouter.logout);
	// wrong session ID
	app.get('/sid_wrong', publicRouter.sidWrong);

	//register page
	app.get('/register', publicRouter.register);

	//main page if logged in
	app.get('/dashboard', dashboardRouter.dashboard);

	//settings page
	app.get('/settings', settingsRouter.settings);

	//invitation page
	app.get('/invitation', invitationRouter.invitation);

	//household page
	app.post('/household/create', householdRouter.householdCreate);
	app.post('/household/update', householdRouter.householdUpdate);
	app.post('/household/invitation/create', householdInvitationRouter.householdInvitationCreate);
	app.post('/household/invitation/accept', householdInvitationRouter.householdInvitationAccept);
	app.post('/household/invitation/decline', householdInvitationRouter.householdInvitationDecline);
	app.post('/household/invitation/cancel', householdInvitationRouter.householdInvitationCancel);
	app.post('/household/invitation/cancel2', householdInvitationRouter.householdInvitationCancel2);
	app.get('/household/:id', householdRouter.household);
	//app.post('/household/leave', customerRouter.householdLeave);

	//shopping_list page
	app.post('/shopping_list/create', shoppingListRouter.shoppingListCreate);
	app.post('/shopping_list/update', shoppingListRouter.shoppingListUpdate);
	app.post('/shopping_list/delete', shoppingListRouter.shoppingListDelete);
	app.get('/shopping_list/:id', shoppingListRouter.shoppingList);

	//shopping_item page
	app.post('/shopping_item/create', shoppingItemRouter.shoppingItemCreate);
	app.post('/shopping_item/update', shoppingItemRouter.shoppingItemUpdate);
	app.post('/shopping_item/delete', shoppingItemRouter.shoppingItemDelete);
	app.get('/shopping_item/:id', shoppingItemRouter.shoppingItem);

	//notofications page
	app.get('/notifications', notificationRouter.notification);

	//api
	app.use('/api', apiRouter());

	//imprint page
	app.get('/imprint', publicRouter.imprint);

	//privacy page
	app.get('/privacy', publicRouter.privacy);

	//policies page
	app.get('/policies', publicRouter.policies);
};
