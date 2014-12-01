'use strict'

var lnm = angular.module('lnm', ['ngResource', 'ngRoute', 'ngAnimate', 'ui.bootstrap'])

lnm.config(function ($routeProvider, $locationProvider, $httpProvider) {

	//================================================
	// Check if the user is connected
	//================================================
	var checkLoggedin = function ($q, $timeout, $http, $location, $rootScope) {

		// Initialize a new promise
		var deferred = $q.defer()

		// Make an AJAX call to check if the user is logged in
		$http.get('/loggedin').success(function (user) {

			// Authenticated
			if (user !== '0') {

				$rootScope.authUser = user
				$timeout(deferred.resolve, 0)
			}

			// Not Authenticated
			else {

				$rootScope.message = 'You need to log in.'
				$rootScope.authUser = null
				$timeout(function () { deferred.reject() }, 0)
				$location.url('/')
			}
		})

		return deferred.promise
	}

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push(function ($q, $location) {

		return {

			// Success: just return the response
			response: function (response) {

				return response
			},
			// Error: check the error status to get only the 401
			responseError: function (response) {

				if (response.status === 401)
					$location.url('/')

				return $q.reject(response)
			}
		}
    })

	//================================================
	// Define all the routes
	//================================================
	$routeProvider
	.when('/', {

		templateUrl: '/views/accueil.html'
	})
	.when('/royaume', {

		templateUrl: '/views/roy.html',
		controller: 'RoyCtrl',
		resolve: {
			loggedin: checkLoggedin
		}
	})
	.when('/construire', {

		templateUrl: '/views/construire.html',
		controller: 'ConstCtrl',
		resolve: {
			loggedin: checkLoggedin
		}
	})
	.when('/irapide', {

		templateUrl: '/views/irapide.html',
		controller: 'SignupCtrl'
	})
	.when('/messagerie/envoyer', {

		templateUrl: '/views/envoyer.html',
		controller: 'EnvCtrl',
		resolve: {
			loggedin: checkLoggedin
		}
	})
	.when('/messagerie', {
		templateUrl: '/views/messagerie.html',
		controller: 'ConvsCtrl',
		resolve: {
			loggedin: checkLoggedin
		}
	})
	.when('/messagerie/conversation/:id', {
		templateUrl: '/views/message.html',
		controller: 'ConvCtrl',
		resolve: {
			loggedin: checkLoggedin
		}
	})
	.otherwise({

		redirectTo: '/'
	})
	//================================================
})
.run(function ($rootScope, $http, $location, $window) {

	$rootScope.message = ''

	// Logout function is available in any pages
	$rootScope.logout = function () {

		$rootScope.message = 'Logged out.'

		// Post logout to node
		$http.post('/logout').success(function () {

			// Relocate to home
			$location.url('/')

			// Reset authUser and reload page to refresh controller
			$rootScope.authUser = null
			$window.location.reload()
		})
	}
})

lnm.factory('socket', function ($rootScope) {

	var socket// = io.connect('http://localhost:3000')
	return {

		on: function (eventName, callback) {

			socket.on(eventName, function () {

				var args = arguments
				$rootScope.$apply(function () {

					callback.apply(socket, args)
				})
			})
		},
		emit: function (eventName, data, callback) {

			socket.emit(eventName, data, function () {

				var args = arguments
				$rootScope.$apply(function () {

					if (callback)
						callback.apply(socket, args)
				})
			})
		},
		connect: function () {

			socket = io.connect('http://localhost:3000')
		}
	}
})

lnm.controller('HeadCtrl', function ($rootScope, $scope, $http, $location, socket) {

	$scope.isCollapsed = true

	// Check if user is logged before all
	$http.get('/loggedin').success(function (user) {

		// Authenticated
		if (user !== '0') {

			$rootScope.authUser = user

			// Connect socket
			socket.connect()

			// Get resources
			$http.get('/infos').success(function (data) {

				$scope.ressources = data
			})

			// Tick new turn
			socket.on('tick', function () {

				$http.get('/infos').success(function (data) {

					$scope.ressources = data
				})
			})
		}
	})

	// This object will be filled by the form
	$scope.user = {}

	// Register the login() function
	$scope.login = function () {

		$http.post('/login', {

			username: $scope.user.username,
			password: $scope.user.password
		})
		.success(function (user) {

			// No error: authentication OK
			socket.connect()
			$rootScope.authUser = user

			// Get infos and redirect to the index page
			$http.get('/infos').success(function (data) {

				$scope.ressources = data
				$location.path('/royaume')
			})
		})
		.error(function (data) {

			// Error: authentication failed
			if (data.message)
				alert('auth failed: ' + data.message)
			else
				alert('auth failed: ' + data)

			$rootScope.authUser = null
			$location.path('/')
		})
	}
})

lnm.controller('SignupCtrl', function ($rootScope, $scope, $http, $location, socket) {

	// This object will be filled by the form
	$scope.user = {}

	// Register the signup() function
	$scope.signup = function () {

		$http.post('/signup', $scope.user).success(function (response) {

			// If successful we assign the response to the global user model
			$rootScope.authUser = response
			socket.connect()

			// Get infos and redirect to the index page
			$http.get('/infos').success(function (data) {

				$scope.$parent.ressources = data
				$location.path('/royaume')
			})
			
		}).error(function (response) {

			alert('signup failed: ' + response.message)
		})
	}
})

lnm.controller('RoyCtrl', function ($scope, $http, socket) {

	/*socket.on('test', function (data) {
		alert(data.message)
	})

	$scope.testtimerandserversentmessage = function () {
		$http.post('/testtimerandserversentmessage', {})
	}*/
})

lnm.controller('EnvCtrl', function ($scope, $http, $location, socket) {

	$scope.conversation = { destinataires: [] }
	$scope.inputRoyaume = undefined

	$scope.envoyer = function () {

		$http.post('/conv/envoyer', $scope.conversation).success(function (data) {

			$location.path('/messagerie')
		})
	}

	$scope.to = function () {

		$http.get('/royaumes/names').success(function (data) {

			$scope.royaumes = data
		})
	}

	$scope.add = function() {

		if ($scope.inputRoyaume && $scope.conversation.destinataires.indexOf($scope.inputRoyaume) == -1) {

			$scope.conversation.destinataires.push($scope.inputRoyaume)
			$scope.inputRoyaume = ''
		}
	}

	$scope.remove = function (i) {

		$scope.conversation.destinataires.splice(i, 1)
	}

	$scope.to()
})

lnm.controller('ConvsCtrl', function ($scope, $http, $location, socket) {

	$scope.page = 1

	$scope.liste = function () {

		$http.get('/conv/liste/' + $scope.page).success(function (data) {

			$scope.conversations = data
		})
	}

	$scope.next = function () {

		if ($scope.conversations.length == 50) {

			$scope.page += 1
			$scope.liste()
		}
	}

	$scope.previous = function () {

		if ($scope.page > 1) {

			$scope.page = ($scope.page <= 1) ? 1 : $scope.page - 1
			$scope.liste()
		}
	}

	$scope.previousClasses = function () {

		var classes = 'next'
		if ($scope.page <= 1) classes += ' disabled'
		return classes
	}

	$scope.nextClasses = function () {

		var classes = 'previous'
		if ($scope.conversations.length < 50) classes += ' disabled'
		return classes
	}

	$scope.view = function (id) {

		$location.path('/messagerie/conversation/' + id)
	}

	// TODO: socket listen to new message

	$scope.liste()
})

lnm.controller('ConvCtrl' , function ($scope, $http, $location, $routeParams, $anchorScroll, $timeout) {

	$scope.reply = false
	$scope.id = $routeParams.id

	$scope.get = function () {

		$http.get('/conv/' + $scope.id).success(function (data) {

			$scope.conversation = data
			$http.get('/conv/mark/read/' + $scope.id)
			$scope.opened = []
			for (var i = 0; i < $scope.conversation.messages.length; i++) {

				if (i == $scope.conversation.messages.length - 1)
					$scope.opened.push(true)
				else
					$scope.opened.push(false)
			}
		})
	}

	$scope.send = function () {

		$http.post('/conv/reply/' + $scope.id, { content: $scope.content }).success(function (data) {

			$scope.content = ''
			$scope.get()
		})
	}

	$scope.bottom = function () {

        	var old = $location.hash()
			$location.hash('shadow')
			$anchorScroll()
			$location.hash(old)
	}

	$scope.get()
})

lnm.controller('ConstCtrl', function ($scope, $http, $modal, socket) {

	$scope.constructions = {}
	$scope.collapsed = []

	$scope.production = function () {

		$scope.type = 0
	}

	$scope.militaire = function () {

		$scope.type = 1
	}

	$scope.espionnage = function () {

		$scope.type = 2
	}

	$scope.production()

	$http.get('/bat/liste').success(function (data) {

		$scope.batiments = data
		for (var i = data.length - 1; i >= 0; i--) {

			$scope.constructions[data[i]._id] = 0
			$scope.collapsed[i] = false
		}
		$scope.computeCosts()
	})

	$scope.computeCosts = function () {

		$scope.costs = { food: 0, wood: 0, iron: 0, stone: 0, gold: 0, space: 0, peon: 0 }

		for (var i = $scope.batiments.length - 1; i >= 0; i--) {

			var nbBuilding = $scope.constructions[$scope.batiments[i]._id]
			$scope.costs.food += nbBuilding * $scope.batiments[i].nr
			$scope.costs.wood += nbBuilding * $scope.batiments[i].bs
			$scope.costs.iron += nbBuilding * $scope.batiments[i].fr
			$scope.costs.stone += nbBuilding * $scope.batiments[i].pr
			$scope.costs.space += nbBuilding * $scope.batiments[i].ha
			$scope.costs.peon += nbBuilding * $scope.batiments[i].peon
		}

		$scope.alertFood = ($scope.ressources.nr < $scope.costs.food) ? "text-alert" : ""
		$scope.alertIron = ($scope.ressources.fr < $scope.costs.iron) ? "text-alert" : ""
		$scope.alertWood = ($scope.ressources.bs < $scope.costs.wood) ? "text-alert" : ""
		$scope.alertStone = ($scope.ressources.pr < $scope.costs.stone) ? "text-alert" : ""
		$scope.alertGold = ($scope.ressources.or < $scope.costs.gold) ? "text-alert" : ""
		$scope.alertSpace = ($scope.ressources.ha.free < $scope.costs.space) ? "text-alert" : ""
	}

	$scope.construire = function () {

		$http.post('/bat/construire', $scope.constructions).success(function (data) {

			reset()
			$http.get('/infos').success(function (data) {

				$scope.$parent.ressources = data
			})
		}).error(function (data) {

			$modal.open({
				templateUrl: '/views/modals/error.html',
				controller: 'ErrorModalController',
				resolve: {
					message: function () {
						return data.message
					}
				}
			})
		})
	}

	$scope.max = function (i) {

		var bdg = $scope.batiments[i]
		$scope.constructions[bdg._id] = 0
		$scope.computeCosts()
		var min = Math.min(
			Math.floor(($scope.ressources.fr - $scope.costs.iron) / bdg.fr),
			Math.floor(($scope.ressources.bs - $scope.costs.wood) / bdg.bs),
			Math.floor(($scope.ressources.pr - $scope.costs.stone) / bdg.pr),
			Math.floor(($scope.ressources.or - $scope.costs.gold) / bdg.or),
			Math.floor(($scope.ressources.ha.free - $scope.costs.space) / bdg.ha)
		)
		$scope.constructions[bdg._id] = (isNaN(min) || min < 0) ? 0 : min
		$scope.computeCosts()
	}

	// Tick new turn
	socket.on('tick', function () {

		$http.get('/bat/liste').success(function (data) {

			$scope.batiments = data
		})
	})

	function reset() {

		for (var id in $scope.constructions) {

			$scope.constructions[id] = 0
		}
	}

	$scope.collapseAll = function (collapse) {

		for (var i = $scope.collapsed.length - 1; i >= 0; i--) {

			$scope.collapsed[i] = collapse
		}
	}
})

lnm.controller('ErrorModalController', function ($scope, message) {

	$scope.message = message
})