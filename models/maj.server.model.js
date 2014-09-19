'use strict'

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema

/**
 * Maj Schema
 */
var MajSchema = new Schema({

	royaume_id: {
		type: Schema.Types.ObjectId,
		ref: 'Royaume'
	},
	royaume_target_id: {
		type: Schema.Types.ObjectId,
		ref: 'Royaume'
	},
	type: {
		type: String,
		trim: true
	},
	object: {
		type: String,
		trim: true
	},
	qt: {
		type: Number
	},
	start_date: {
		type: Date
	},
	end_date: {
		type: Date
	},
	ip: {
		type: String,
		trim: true
	},
})

mongoose.model('Maj', MajSchema)