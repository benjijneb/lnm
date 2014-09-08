var mongoose = require('mongoose')
var User = mongoose.model('User')
var Royaume = mongoose.model('Royaume')

exports.infos = function(req, res) {

	Royaume.findOne({ user_id: req.user.id }, function(err, roy) {
		update(roy)
		roy.save()
		// Manager error
		// Get and send roy main infos
		res.send({ nr: roy.nr, fr: roy.fr, bs: roy.bs, pr: roy.bs, or: roy.or, ha: roy.ha })
	})
}

function update(roy) {

	// Init variables
	var ress = ['nr', 'fr', 'bs', 'pr', 'or']
	var nbTurns = roy.getTurnsSinceUpdate()
	console.log('Number of turns since previous update: ' + nbTurns)

	// If at least 1 one, let's go for the update
	if(nbTurns > 0) {

		// Ressources update
		for(var i in ress) {
			roy[ress[i]] += 1 * nbTurns
		}
	}
}