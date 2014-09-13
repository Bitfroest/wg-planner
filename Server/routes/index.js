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

var apiRouter = require('./api');

module.exports = function(app) {

	//index page
	app.get('/', publicRouter.index);
	
	//login page
	app.get('/login', publicRouter.login);
	app.post('/login', publicRouter.doLogin);
	
	//logout
	app.post('/logout', publicRouter.logout);
	// wrong session ID
	app.get('/sid_wrong', publicRouter.sidWrong);
	
	//register page
	app.get('/register', publicRouter.register);
	app.post('/register', publicRouter.doRegister);
	
	app.post('/person/update', publicRouter.personUpdate);
	app.post('/person/password_change', publicRouter.personPasswordChange);
	
	//main page if logged in
	app.get('/dashboard', dashboardRouter.dashboard);
	
	app.post('/household/create', householdRouter.householdCreate);
	app.post('/household/update', householdRouter.householdUpdate);
	app.post('/household/invitation/create', householdInvitationRouter.householdInvitationCreate);
	app.post('/household/invitation/accept', householdInvitationRouter.householdInvitationAccept);
	app.post('/household/invitation/decline', householdInvitationRouter.householdInvitationDecline);
	app.post('/household/invitation/cancel', householdInvitationRouter.householdInvitationCancel);
	app.post('/household/invitation/cancel2', householdInvitationRouter.householdInvitationCancel2);
	app.get('/household/:id', householdRouter.household);
	//app.post('/household/leave', customerRouter.householdLeave);
	
	app.post('/shopping_list/create', shoppingListRouter.shoppingListCreate);
	app.post('/shopping_list/update', shoppingListRouter.shoppingListUpdate);
	app.get('/shopping_list/:id', shoppingListRouter.shoppingList);
	
	app.post('/shopping_item/create', shoppingItemRouter.shoppingItemCreate);
	app.post('/shopping_item/update', shoppingItemRouter.shoppingItemUpdate);
	app.post('/shopping_item/delete', shoppingItemRouter.shoppingItemDelete);
	app.get('/shopping_item/:id', shoppingItemRouter.shoppingItem);
	
	app.use('/api', apiRouter());
	
	//imprint page
	app.get('/imprint', publicRouter.imprint);
};
