'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema

/**
 * Royaume Schema
 */
var BatRoySchema = new Schema({

	royaume_id: {
		type: Schema.Types.ObjectId,
		ref: 'Royaume'
	},
	bat_id: {
		type: Schema.Types.ObjectId,
		ref: 'BatRoy'
	},
	qt: {
		type: Number,
		default: 0
	}
})

/**
 * Hook a pre save method to hash the password
 */
BatRoySchema.pre('save', function(next) {

	next()
})

mongoose.model('BatRoy', BatRoySchema)