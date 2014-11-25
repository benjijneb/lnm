'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema

/**
 * Message Schema
 */
var MessageSchema = new Schema({

	conversation_id: {
		type: Schema.Types.ObjectId,
		ref: 'Conversation'
	},
	sender: {
		type: Schema.Types.ObjectId,
		ref: 'Royaume'
	},
	content: {
		type: String,
		trim: true
	},
	sent: {
		type: Date,
		default: Date.now
	}
})

mongoose.model('Message', MessageSchema)