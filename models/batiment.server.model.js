'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema

/**
 * Royaume Schema
 */
var BatimentSchema = new Schema({


	unit: {
		type: Schema.Types.ObjectId
	},
	description: {
		type: String,
		trim: true
	},
	type: {
		type: Number
	},
	nr: {
		type: Number
	},
	fr: {
		type: Number
	},
	bs: {
		type: Number
	},
	pr: {
		type: Number
	},
	or: {
		type: Number
	},
	ha: {
		type: Number
	},
	tr: {
		type: Number
	},
	pv: {
		type: Number
	},
	pp: {
		type: Number
	}
})

/**
 * Hook a pre save method to hash the password
 */
BatimentSchema.pre('save', function(next) {

	next()
})

BatimentSchema.statics.getAll = function(cb) {

	this.find({}, cb)
}

mongoose.model('Batiment', BatimentSchema)