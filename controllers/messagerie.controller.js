var async = require('async')
var utils = require('utils')
var mongoose = require('mongoose')
var Royaume = mongoose.model('Royaume')
var Conversation = mongoose.model('Conversation')
var Message = mongoose.model('Message')

exports.list = function (req, res) {

	Royaume.findOne({ user_id: req.user._id }, function (err, royaume) {

		var page = req.param('page')
		if(!page || isNaN(page) || page < 0) page = 1

		Conversation.find().or([{ creator: royaume._id}, {participants: royaume._id}]).sort('-updated')
			.skip((page - 1) * 50).limit(50)
			.exec(function (err, conversations) {

			var conversationsRes = []
			for (var i = 0; i < conversations.length; i++) {

				var conversation = conversations[i]
				var lastMsg = conversation.messages[conversation.messages.length - 1]
				var readFlag = (conversation.read.indexOf(royaume._id) < 0) ? false : true
				var guildFlag = false
				var adminFlag = false

				conversationsRes.push({

					id: conversation.id,
					objet: conversation.title,
					last_date: utils.toDisplayableDate(lastMsg.sent),
					last_roy: lastMsg.sender,
					read: readFlag,
					guild: guildFlag,
					admin: adminFlag
				})
			}
			res.jsonp(conversationsRes)
		})

	})
}

exports.send = function (req, res) {

	Royaume.findOne({ user_id: req.user._id }, function (err, royaume) {

		var title = req.param('objet')
		var content = req.param('contenu')
		var recipients = req.param('destinataires')
		var recipientsId = [royaume._id]

		async.waterfall([

			function (callback) {

				async.eachSeries(recipients, function (recipient, callbackSeries) {

					Royaume.findOne({ name: recipient }, function (err, royaume) {

						recipientsId.push(royaume._id)
						callbackSeries()
					})
				}, function (err) {

					callback(null)
				})
			}
		], function (err) {

			Conversation.create({

				title: (title) ? title.trim() : '(aucun objet)',
				creator: royaume._id,
				rp: false,
				admin: false,
				guilde: false,
				participants: recipientsId,
				messages: [{
					sender: royaume._id,
					content: content
				}],
				read: [royaume._id]
			}, function (err, conversation) {
				// Nothing
				res.send('sent')
			})
		})
	})
}

exports.markAsRead = function(req, res) {

	// First thing first, find Royaume
	Royaume.findOne({ user_id: req.user._id }, function (err, royaume) {

		// Get conversation
		var conversationId = req.param('id')
		Conversation.findOne({ _id: conversationId }, function (err, conversation) {

			// Send back error if no conversation found
			if (!conversation)
				return res.status(500).send('Cette conversation n\'existe pas.')

			// Chedk if already marked as read and mark as read if neede
			var read = conversation.read
			for (var i = read.length - 1; i >= 0; i--) {

				if (String(read[i]) == String(royaume._id)) {

					console.log('already marked as read')
					return res.send("marked as read")
				}
			}
			if (!read || read.length <= 0) {

				conversation.read = [royaume._id]
			} else {

				conversation.read.push(royaume._id)
			}
			conversation.save()
			console.log('marked as read')
			return res.send("marked as read")
		})
	})
}

exports.markAsUnread = function (req, res) {

	// First thing first, find Royaume
	Royaume.findOne({ user_id: req.user._id }, function (err, royaume) {

		// Get conversation
		var conversationId = req.param('id')
		Conversation.findOne({ _id: conversationId }, function (err, conversation) {

			// Send back error if no conversation found
			if (!conversation)
				return res.status(500).send('Cette conversation n\'existe pas.')

			// Mark as unread (delete from read)
			var read = conversation.read
			for (var i = read.length - 1; i >= 0; i--) {

				if (read[i] == royaume._id)
					read.slice(i, 1)
			}
			conversation.save()
			return res.send("marked as unread")
		})
	})
}

exports.reply = function (req, res) {

	var convId = req.param('id')
	var content = req.param('content')
	Royaume.findOne({ user_id: req.user._id }, function (err, royaume) {

		Conversation.findOne({ _id: convId }, function (err, conversation) {

			if(!conversation)
				return res.status(500).send('Cette conversation n\'existe pas.')

			conversation.messages.push({

				sender: royaume._id,
				content: content
			})
			conversation.save()
			res.send('ok')
		})
	})
}

exports.read = function (req, res) {

	var convId = req.param('id')
	// First thing first, find Royaume
	Royaume.findOne({ user_id: req.user._id }, function (err, royaume) {

		Conversation.findOne({ _id: convId }, function (err, conversation) {

			var conversationJson = {
				title: conversation.title,
				read: conversation.read,
				guild: conversation.guilde,
				admin: conversation.admin,
				rp: conversation.rp,
				created: utils.toDisplayableDate(conversation.created),
				participants: [],
				messages: []
			}

			async.waterfall([

				function (callback) {

					Royaume.findOne({ _id: conversation.creator }, 'name', function (err, royaume) {

						if(royaume)
							conversationJson.creator = royaume.name
						callback()
					})
				},
				function (callback) {

					async.eachSeries(conversation.participants, function (participant, callbackSeries1) {

						Royaume.findOne({ _id: participant }, 'name', function (err, royaume) {

							if (royaume)
								conversationJson.participants.push(royaume.name)
							callbackSeries1()
						})
					}, function (err) {

						callback()
					})
				},
				function (callback) {

					async.eachSeries(conversation.messages, function (message, callbackSeries2) {

						Royaume.findOne({ _id: message.sender }, 'name', function (err, royaume) {

							var msgJson = { content: message.content, sent: utils.toDisplayableDate(message.sent) }
							msgJson.sender = (royaume) ? royaume.name : "Inconnu"
							conversationJson.messages.push(msgJson)
							callbackSeries2()
						})
					}, function (err) {

						callback()
					})
				}
			], function (err) {

				res.json(conversationJson)
			})
		})
	})
}

