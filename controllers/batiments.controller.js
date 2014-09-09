var mongoose = require('mongoose')
var User = mongoose.model('User')
var Royaume = mongoose.model('Royaume')
var Maj = mongoose.model('Maj')

exports.list = function(req, res) {
	
}

exports.build = function(req, res) {

	// First thing first, find royaume
	var royaume = Royaume.findOne({ user_id: req.user.id }, function(err, royaume) {
	
		if(err)
			res.send('WTF no royaume ?')

		var buildings = req.body
		for(var id in buildings) {

			var endTime = Royaume.getTurnDate(1)
			new Maj({
				royaume_id: royaume._id,
				type: '0',
				object: id,
				qt: buildings[id],
				start_date: Royaume.getTurnDate(0),
				end_date: endTime
			}).save()
		}
	})
	
	/*var cron = new CronJob('0 0,3,6,9,12,15,18,21,24,27,30,33,36,39,42,45,48,51,54,57 * * * *', function(){
		console.log('Time to update ! ' + new Date())
		socket.emit('tick')
	}, null, true)*/
}