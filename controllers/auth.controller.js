var http = require('http')
var mongoose = require('mongoose')
var User = mongoose.model('User')
var Royaume = mongoose.model('Royaume')

exports.loggedin = function(req, res) {
	res.send(req.isAuthenticated() ? req.user : '0')
}

exports.login = function(req, res) {

	res.send(req.user)
}

exports.logout = function(ioS) {

	return function(req, res) {

		for ( var i in ioS.sockets.connected ) {

			if(ioS.sockets.connected[i].request.user.username === req.user.username) {

				console.log('Client disconnection (' + req.user.username + ')')
				ioS.sockets.connected[i].disconnect()
			}
		}
		req.logOut()
		res.status(200).end(http.STATUS_CODES[200])
	}
}

exports.signup = function(req, res) {

	// For security measurement we remove the roles from the req.body object
	delete req.body.roles

	// Init Variables
	var user = new User(req.body)
	var message = null

	// Add missing user fields
	user.provider = 'local'
	user.displayName = user.username

	// Then save the user 
	user.save(function(err) {

		if(err) {

			res.status(400).send(err)
		} else {

			// Create royaume
			var roy = new Royaume()
			roy.create(user.id, user.displayName)

			// Remove sensitive data before login
			user.password = undefined
			user.salt = undefined

			req.login(user, function(err) {

				if (err) {

					res.status(400).send(err)
				} else {

					res.jsonp(user)
				}
			})
		}
	})
}