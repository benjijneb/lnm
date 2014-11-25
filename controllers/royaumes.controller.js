var async = require('async')
var mongoose = require('mongoose')
var Royaume = mongoose.model('Royaume')
var Batiment = mongoose.model('Batiment')
var Maj = mongoose.model('Maj')
var BatRoy = mongoose.model('BatRoy')

exports.names = function (req, res) {

	Royaume.findOne({ user_id: req.user.id }, function (err, roy) {

		Royaume.find({ _id: { $nin: [roy._id] } }, 'name', function (err, royaumes) {

			if(royaumes) {

				res.jsonp(royaumes)
			} else {

				res.jsonp({})
			}
		})
	})
}

exports.infos = function (req, res) {

	// First thing first, find royaume
	Royaume.findOne({ user_id: req.user.id }, function (err, roy) {

		// WATERFALL !
		async.waterfall([

			// Update royaume
			function (callback) {

				update(roy)
				callback(null)
			},
			// Save updated royaume
			function (callback) {

				roy.save()
				callback(null)
			},
			// Get hectare values
			function (callback) {

				roy.getFreeHa(function (freeHa) {

					callback(null, freeHa)
				})
			},
			// Get number of pending buildings
			function (freeHa, callback) {

				Maj.find({ royaume_id: roy._id, type: 0, end_date : { $gte: new Date() } }, function (err, majs) {

					callback(null, freeHa, majs.length)
				})
			}
		], function (err, freeHa, nbPendingBuildings) {

			if(nbPendingBuildings <= 0)
				nbPendingBuildings = ''
			// Send all gathered info
			res.send({ nr: roy.nr, fr: roy.fr, bs: roy.bs, pr: roy.bs, or: roy.or, ha: freeHa + '/' + roy.ha, pending: nbPendingBuildings })
		})
	})
}

function update(roy) {

	// Init variables
	var ress = ['nr', 'fr', 'bs', 'pr', 'or']
	var nbTurns = Royaume.getTurnsSinceUpdate(roy)
	console.log('Number of turns since previous update: ' + nbTurns)

	// If at least 1 one, let's go for the update
	if (nbTurns > 0) {

		// Ressources update
		for (var i in ress) {

			roy[ress[i]] += 1 * nbTurns
		}

		// Proceed maj queue
		Maj.find({ end_date : { $lte: Royaume.getTurnDate(0) } }, function (err, majs) {

			if (err)
				console.log(err)

			console.log(roy._id + ' has ' + majs.length + ' maj in queue')
			async.eachSeries(majs, function (maj, callback) {

				console.log('Maj type: ' + maj.type)
				if(Number(maj.type) == 0) {

					// Buildings
					console.log('Building finished: ' + maj.qt + ' ' + maj.object)
					BatRoy.findOneAndUpdate({ royaume_id: roy._id, bat_id: maj.object} , { $inc: { qt: maj.qt } }, function (err, batRoy) {

						Maj.remove( {_id: maj._id }).exec()

						if(!batRoy) {

							BatRoy.create({ royaume_id: roy._id, bat_id: maj.object, qt: maj.qt }, function (err, batRoy) {

								callback()
							})
						} else {
							callback()
						}
					})
				}
			})
		})
	}
}