'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto')

/**
 * Royaume Schema
 */
var RoyaumeSchema = new Schema({

	user_id: {
		type: Schema.Types.ObjectId
	},
	nr: {
		type: Number,
		default: 100000
	},
	fr: {
		type: Number,
		default: 100000
	},
	bs: {
		type: Number,
		default: 100000
	},
	pr: {
		type: Number,
		default: 100000
	},
	or: {
		type: Number,
		default: 100000
	},
	ha: {
		type: Number,
		default: 1000
	},
	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	}
})

/**
 * Hook a pre save method to hash the password
 */
RoyaumeSchema.pre('save', function(next) {

	this.updated = new Date()
	next()
})

RoyaumeSchema.methods.getTurnsSinceUpdate = function getTurnsSinceUpdate() {

	var now = toTurnDate(new Date())
	var updated = toTurnDate(new Date(this.updated))
	return Math.floor((now - updated) / 180000)
}

RoyaumeSchema.methods.getNextTurnDate = function getNextTurnDate() {

	return toTurnDate(new Date(new Date().getTime() + 180000))
}

function toTurnDate(date) {

	var turnDateMinutes = Math.floor(date.getMinutes() / 3) * 3
	date.setMinutes(turnDateMinutes)
	date.setSeconds(0)
	date.setMilliseconds(0)
	return date
}

mongoose.model('Royaume', RoyaumeSchema)