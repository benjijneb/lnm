var async = require('async')
var mongoose = require('mongoose')
var Batiment = mongoose.model('Batiment')
var Royaume = mongoose.model('Royaume')
var BatRoy = mongoose.model('BatRoy')
var Maj = mongoose.model('Maj')

exports.list = function (req, res) {

		// First thing first, find royaume
	Royaume.findOne({ user_id: req.user.id }, function (err, royaume) {

		// WTF no royaume ?
		if (err)
			res.status(500).send({ message: 'Royaume inexistant.' })

		// Init
		var batsRoy = []


		// Get all buildings
		Batiment.getAll(function (err, batiments) {

			if (err) return console.log(err)

			async.eachSeries(batiments, function(bat, callback) {

				bat = bat.toObject()
				BatRoy.findOne({ royaume_id: royaume._id, bat_id: bat._id }, function (err, batRoy) {

					if (err) console.log(err)

					if (batRoy) {

						bat.qt = batRoy.qt
					}
					batsRoy.push(bat)
					callback()
				})
			}, function(err) {

				if (err)
					console.log(err)
				else
					res.jsonp(batsRoy)
			})
		})
	})
}

exports.build = function (req, res) {

	// Posted values
	var requested = req.body

	// First thing first, find royaume
	Royaume.findOne({ user_id: req.user.id }, function (err, royaume) {
	
		// WTF no royaume ?
		if (err)
			return res.status(500).send({ message: 'Royaume inexistant.' })

		// Init
		var cost = { nr: 0, fr: 0, bs: 0, pr: 0, or: 0, ha: 0 }

		async.waterfall([

			function (callback) {

				// Get all batimentd and calculate costs
				Batiment.getAll(function (err, batiments) {

					// Calculate all costs
					for (var i = batiments.length - 1; i >= 0; i--) {

						var bat = batiments[i]
						if (Number(requested[bat._id]) > 0) {

							cost.nr += bat.nr * requested[bat._id]
							cost.fr += bat.fr * requested[bat._id]
							cost.bs += bat.bs * requested[bat._id]
							cost.pr += bat.pr * requested[bat._id]
							cost.or += bat.or * requested[bat._id]
							cost.ha += bat.ha * requested[bat._id]
						}
					}
					callback(null, batiments)
				})
			},
			function (batiments, callback) {

				// Get free hectares value
				royaume.getFreeHa(function (freeHa) {

					console.log('Free ha: ' + freeHa)
					callback(null, batiments, freeHa)
				})
			},
			function (batiments, freeHa, callback) {

				// Validate and build if possible or send error
				if (royaume.nr >= cost.nr && royaume.fr >= cost.fr && royaume.bs >= cost.bs && royaume.pr >= cost.pr
					&& royaume.or >= cost.or && freeHa >= cost.ha) {

					// If validated, build
					for (var id in requested) {

						// Obviously build only if requested > 0
						if (Number(requested[id]) > 0) {

							// Get turns number
							var endTime = Royaume.getTurnDate(1)
							for (var i = batiments.length - 1; i >= 0; i--) {

								if (batiments[i]._id == id) {

									endTime = Royaume.getTurnDate(batiments[i].tr)
									break
								}
							}

							// Insert maj
							new Maj({
								royaume_id: royaume._id,
								type: '0',
								object: id,
								qt: requested[id],
								start_date: Royaume.getTurnDate(0),
								end_date: endTime
							}).save()
						}
					}
					// Remove resources
					royaume.update({ $inc: { nr: cost.nr * -1, fr: cost.fr * -1, bs: cost.bs * -1, pr: cost.pr * -1, or: cost.or * -1 } })
						.exec()
					callback(null)
				} else {

					callback('Vous n\'avez pas les ressources nécessaires.', null)
				}
			}
		], function (err) {

			if (err) {
				res.status(500).send({ message: err })
			} else {
				res.send('OK')
			}
		})
	})
}