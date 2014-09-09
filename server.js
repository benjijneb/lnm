//==================================================================
// LIB
var express = require('express')
var session = require('express-session')
var path = require('path')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var http = require('http')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var mongoose = require('mongoose')
var io = require('socket.io')
var passportSocketIo = require("passport.socketio")
var CronJob = require('cron').CronJob

//==================================================================
// LOAD MODELS
require("fs").readdirSync("./models").forEach(function(file) {
	require("./models/" + file)
})
var User = mongoose.model('User')

//==================================================================
// PASSPORT
// Define the strategy to be used by PassportJS
passport.use(new LocalStrategy(

	function(username, password, done) {

		User.findOne({username: username}, function(err, user) {
			if(err)
				return done(err)
			
			if(!user)
				return done(null, false, { message: 'Incorrect username.' })
			
			if (!user.authenticate(password)) {
				return done(null, false, { message: 'Invalid password' })
			}

			return done(null, user)
		})
	}
))

// Define a middleware function to be used for every secured routes
var auth = function(req, res, next){
	if (!req.isAuthenticated()) {
		console.log(req.url + ": unauthorised")
		res.status(401).end(http.STATUS_CODES[401])
	} else {
		console.log(req.url + ": authorised")
		next()
	}
}

// Serialized and deserialized methods when got from session
passport.serializeUser(function(user, done) {
	done(null, user.username);
})
passport.deserializeUser(function(username, done) {
	User.findOne({
		username: username
	}, '-salt -password', function(err, user) {
		done(err, user);
	})
})

//==================================================================
// APPLICATION CONFIG
var db = mongoose.connect('mongodb://localhost/lnm-dev')
var sessionStore = require('mongoose-session')(mongoose)
var app = express()
app.set('port', process.env.PORT || 3000)
app.use(cookieParser())
app.use(session({
	name: 'lnm.express.sid',
	secret: 'iacthulhufhtagn',
	store: sessionStore,
	resave: true,
	saveUninitialized: true,
	unset: 'destroy'
}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(passport.initialize())
app.use(passport.session())

//==================================================================
// LAUNCH SERVER
var server = http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'))
})

//==================================================================
// SOCKET IO
var ioServer = io.listen(server)
ioServer.use(passportSocketIo.authorize({
	cookieParser: cookieParser,
	key: 'lnm.express.sid',
	secret: 'iacthulhufhtagn',
	store: sessionStore
}))

ioServer.sockets.on('connection', function (socket) {
    console.log('Client connected: (' + socket.request.user.username + ')')
	var cron = new CronJob('0 0,3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48,51,54,57 * * * *', function(){
		console.log('Time to update ! ' + new Date())
		socket.emit('tick')
	}, null, true)
	console.log('Cron job started')
	//console.log(ioServer.sockets.connected[socket.id].client.request.user.name)
	socket.on('disconnect', function(socket) {
		console.log('A client is disconnected')
		cron.stop()
		console.log('Cron job stopped')
	})
})

//==================================================================
// LOAD ROUTES
require('./config/routes')(app, passport, auth, ioServer)