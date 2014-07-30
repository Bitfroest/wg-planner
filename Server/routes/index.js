/*
 * Router
 *
 * Routes all URLs to a specific controller.
 * The router can differentiate between GET, POST and all the other REST methods.
 */
 
var publicRouter = require('./public');
var customerRouter = require('./customer');

module.exports = function(app) {

	//index page
	app.get('/', publicRouter.index);
	
	//login page
	app.get('/login', publicRouter.login);
	app.post('/login', publicRouter.doLogin);
	
	//logout
	app.get('/logout', publicRouter.logout);
	// wrong session ID
	app.get('/sid_wrong', publicRouter.sidWrong);
	
	//register page
	app.get('/register', publicRouter.register);
	app.post('/register', publicRouter.doRegister);
	
	//main page
	app.get('/main', customerRouter.main);
	
	app.get('/household', customerRouter.household);
	app.post('/household/create', customerRouter.householdCreate);
	app.post('/household/invitation/create', customerRouter.householdInvitationCreate);
	app.post('/household/invitation/accept', customerRouter.householdInvitationAccept);
	app.post('/household/invitation/decline', customerRouter.householdInvitationDecline);
	app.post('/household/invitation/cancel', customerRouter.householdInvitationCancel);
	//app.post('/household/leave', customerRouter.householdLeave);
	
	//imprint page
	app.get('/imprint', publicRouter.imprint);
	
	//view counter
	app.get('/hello.txt', publicRouter.hello);

	//URL with parameter
	app.get('/group/:groupId', publicRouter.group);
};