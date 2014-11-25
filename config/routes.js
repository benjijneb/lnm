'use strict'

//==================================================================
// ROUTES
//==================================================================
module.exports = function (app, passport, authMethod, ioS) {

	var royaumes = require('../controllers/royaumes.controller.js')
	var auth = require('../controllers/auth.controller.js')
	var batiments = require('../controllers/batiments.controller.js')
	var conversations = require('../controllers/messagerie.controller.js')

	app.get('/', function (req, res) {

		res.render('index')
	})

	app.route('/loggedin').get(auth.loggedin)
	app.route('/login').post(passport.authenticate('local'), auth.login)
	app.route('/logout').post(auth.logout(ioS))
	app.route('/signup').post(auth.signup)

	app.route('/infos').get(authMethod, royaumes.infos)

	app.route('/royaumes/names').get(authMethod, royaumes.names)

	app.route('/bat/construire').post(authMethod, batiments.build)
	app.route('/bat/liste').get(authMethod, batiments.list)

	app.route('/conv/liste/:page').get(authMethod, conversations.list)
	app.route('/conv/envoyer').post(authMethod, conversations.send)
	app.route('/conv/:id').get(authMethod, conversations.read)
	app.route('/conv/mark/read/:id').get(authMethod, conversations.markAsRead)
	app.route('/conv/mark/unread/:id').get(authMethod, conversations.markAsUnread)
	app.route('/conv/reply/:id').post(authMethod, conversations.reply)

	//app.route('/conv/lire/:id').get(authMethod, conversations.readConversation)
	//app.route('/conv/lire/msg/:id').get(authMethod, conversations.readMessage)
	//app.route('/conv/envoyer').post(authMethod, conversations.send)

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