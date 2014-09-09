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
var BatimentSchema = new Schema({

	royaume_id: {
		type: Schema.Types.ObjectId
	},
	bat: {
		type: String,
		trim: true
	},
	qt: {
		type: Number,
		default: 0
	}
})

/**
 * Hook a pre save method to hash the password
 */
BatimentSchema.pre('save', function(next) {

	next()
})

mongoose.model('Batiment', BatimentSchema)