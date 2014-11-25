'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema

/**
 * Conversation Schema
 */
var ConversationSchema = new Schema({

	title: {
		type: String,
		trim: true,
	},
	creator: {
		type: Schema.Types.ObjectId,
		ref: 'Royaume'
	},
	participants: {
		type: [Schema.Types.ObjectId],
		ref: 'Royaume'
	},
	messages: [{
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
	}],
	read: {
		type: [Schema.Types.ObjectId],
		ref: 'Royaume'
	},
	rp: [Boolean],
	guilde: [Boolean],
	admin: [Boolean],
	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	}
})

ConversationSchema.pre('save', function (next) {

	this.updated = new Date()
	next()
})

mongoose.model('Conversation', ConversationSchema)