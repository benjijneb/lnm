'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema

/**
 * Royaume Schema
 */
var UnitSchema = new Schema({

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
	/*fr: {
		type: Number
	},
	bs: {
		type: Number
	},
	pr: {
		type: Number
	},*/
	or: {
		type: Number
	},
	tr: {
		type: Number
	}
})

/**
 * Hook a pre save method to hash the password
 */
UnitSchema.pre('save', function(next) {

	next()
})

UnitSchema.statics.getAll = function(cb) {

	this.find({}, cb)
}

mongoose.model('Unit', UnitSchema)