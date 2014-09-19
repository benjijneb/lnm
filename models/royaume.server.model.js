'use strict'

/**
 * Module dependencies.
 */
 var async = require('async')
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	BatRoy = mongoose.model('BatRoy'),
	Batiment = mongoose.model('Batiment'),
	Maj = mongoose.model('Maj')

/**
 * Royaume Schema
 */
var RoyaumeSchema = new Schema({

	user_id: {
		type: Schema.Types.ObjectId,
		ref: 'User'
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
RoyaumeSchema.pre('save', function (next) {

	this.updated = new Date()
	next()
})

RoyaumeSchema.statics.getTurnsSinceUpdate = function (royaume) {

	var now = toTurnDate(new Date())
	var updated = toTurnDate(new Date(royaume.updated))
	return Math.floor((now - updated) / 180000)
}

RoyaumeSchema.statics.getNextTurnDate = function () {

	return toTurnDate(new Date(new Date().getTime() + 180000))
}

RoyaumeSchema.statics.getTurnDate = function (nTurn) {

	return toTurnDate(new Date(new Date().getTime() + 180000 * nTurn))
}

RoyaumeSchema.statics.findByUserId = function (userId) {

	this.findOne({ user_id: userId }, function(err, roy) {

		if(err)
			return err
		return roy
	})
}

RoyaumeSchema.methods.create = function (userId) {

	this.user_id = userId
	this.update = Date.now()
	this.save()
}

RoyaumeSchema.methods.getFreeHa = function (fnCallback) {

	var roy = this
	var allHa = this.ha
	var usedHa = 0

	async.waterfall([

		// Get all batiments
		function (callback) {

			Batiment.getAll(function (err, batiments) {

				callback(null, batiments)
			})
		},
		// Get pending buildings
		function (batiments, callback) {

			Maj.find({ royaume_id: roy._id, type: 0, end_date : { $gte: new Date() } }, function (err, majs) {

				for (var i = majs.length - 1; i >= 0; i--) {

					for (var j = batiments.length - 1; j >= 0; j--) {

						if (String(majs[i].object) == String(batiments[j]._id)) {

							usedHa += batiments[j].ha * majs[i].qt
							break
						}
					}
				}
				callback (null, batiments)
			})
		},
		// Get all builded buildings
		function (batiments, callback) {

			BatRoy.find({ royaume_id: roy._id }, function (err, batRoys) {

				for (var i = batRoys.length - 1; i >= 0; i--) {

					for (var j = batiments.length - 1; j >= 0; j--) {

						if (String(batRoys[i].bat_id) == String(batiments[j]._id)) {

							usedHa += batiments[j].ha * batRoys[i].qt
							break
						}
					}
				}
				callback(null)
			})
		}
	], function (err, result) {

		fnCallback(allHa - usedHa)
	})
}

function toTurnDate(date) {

	var turnDateMinutes = Math.floor(date.getMinutes() / 3) * 3
	date.setMinutes(turnDateMinutes)
	date.setSeconds(0)
	date.setMilliseconds(0)
	return date
}

mongoose.model('Royaume', RoyaumeSchema)