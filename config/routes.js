'use strict'

//==================================================================
// ROUTES
//==================================================================
module.exports = function(app, passport, authMethod, ioS) {

	var royaumes = require('../controllers/royaumes.controller.js')
	var auth = require('../controllers/auth.controller.js')

	app.get('/', function(req, res) {
		res.render('index')
	})

	app.route('/loggedin').get(auth.loggedin)
	app.route('/login').post(passport.authenticate('local'), auth.login)
	app.route('/logout').post(auth.logout(ioS))
	app.route('/signup').post(auth.signup)

	app.route('/infos').get(authMethod, royaumes.infos)

	/*app.post('/testtimerandserversentmessage', authMethod, function(req, res) {
		setTimeout(function() {
			for ( var i in ioS.sockets.connected ) {
				if(ioS.sockets.connected[i].request.user.username === req.user.username) {
					console.log('Emit message to ' + req.user.username)
					ioS.sockets.connected[i].emit('test', { message : 'test from route' })
				}
			}
		}, 3000)
	})*/
}