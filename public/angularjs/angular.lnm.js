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

lnm.controller('SignupCtrl', function ($rootScope, $scope, $http, $location) {

	// This object will be filled by the form
	$scope.user = {}

	// Register the signup() function
	$scope.signup = function () {

		$http.post('/signup', $scope.user).success(function (response) {

			// If successful we assign the response to the global user model
			$rootScope.authUser = response

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

lnm.controller('ConstCtrl', function ($scope, $http, $modal, socket) {

	$scope.constructions = {}

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
		}
	})

	$scope.construire = function () {

		$http.post('/bat/construire', $scope.constructions).success(function (data) {

			reset()
			$http.get('/infos').success(function (data) {

				$scope.$parent.ressources = data
			})
		}).error(function (data) {

			//alert(data.message)
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
})

lnm.controller('ErrorModalController', function ($scope, message) {

	$scope.message = message
})