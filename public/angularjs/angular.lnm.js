'use strict';

var lnm = angular.module('lnm', ['ngResource', 'ngRoute']);

lnm.config(function($routeProvider, $locationProvider, $httpProvider) {

	//================================================
	// Check if the user is connected
	//================================================
	var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
		// Initialize a new promise
		var deferred = $q.defer();

		// Make an AJAX call to check if the user is logged in
		$http.get('/loggedin').success(function(user){
			// Authenticated
			if (user !== '0') {
				$rootScope.authUser = user;
				$timeout(deferred.resolve, 0);
			}

			// Not Authenticated
			else {
				$rootScope.message = 'You need to log in.';
				$rootScope.authUser = null;
				$timeout(function(){ deferred.reject(); }, 0);
				$location.url('/');
			}
		});

		return deferred.promise;
	};

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.interceptors.push(function($q, $location) {
		return {
			// Success: just return the response
			response: function(response){
				return response;
			},
			// Error: check the error status to get only the 401
			responseError: function(response) {
				if (response.status === 401)
					$location.url('/');
				return $q.reject(response);
			}
		};
    });

	//================================================
	// Define all the routes
	//================================================
	$routeProvider
	.when('/', {
		templateUrl: '/views/accueil.html',
		controller: 'AccCtrl'
	})
	.when('/royaume', {
		templateUrl: '/views/roy.html',
		controller: 'RoyCtrl',
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
	});
	//================================================
})
.run(function($rootScope, $http, $location){

	$rootScope.message = '';
	// Logout function is available in any pages
	$rootScope.logout = function() {
		$rootScope.message = 'Logged out.';
		$http.post('/logout');
		$rootScope.authUser = null;
		$location.url('/');
	};
});

lnm.factory('socket', function ($rootScope) {

  var socket = io.connect('http://localhost:3000');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

lnm.controller('HeadCtrl', function($rootScope, $scope, $http, $location, socket) {

	// Check if user is logged before all
	$http.get('/loggedin').success(function(user){
		// Authenticated
		if (user !== '0') {
			$rootScope.authUser = user;
			$http.get('/infos').success(function(data) {
				$scope.ressources = data;
			});
		}
	});
	$http.get('/loggedin').success(function(user){
		// Authenticated
		if (user !== '0') {
			$rootScope.authUser = user;
		}
	});
	// This object will be filled by the form
	$scope.user = {};

	// Register the login() function
	$scope.login = function() {

		$http.post('/login', {
			username: $scope.user.username,
			password: $scope.user.password
		})
		.success(function(user){
			// No error: authentication OK
			$rootScope.authUser = user;
			getInfos();
			$location.url('/royaume');
		})
		.error(function(data){
			// Error: authentication failed
			alert('Authentication failed.' + data);
			$rootScope.authUser = null;
			$location.url('/');
		});
	};

	// Tick nouveau tour
	socket.on('tick', function () {
		$http.get('/infos').success(function(data) {
			$scope.ressources = data;
		});
	});
});

lnm.controller('SignupCtrl', function($rootScope, $scope, $http, $location) {

	// This object will be filled by the form
	$scope.user = {};

	// Register the signup() function
	$scope.signup = function() {
		$http.post('/signup', $scope.user).success(function(response) {
			//If successful we assign the response to the global user model
			$rootScope.authUser = response;
			//And redirect to the index page
			$location.path('#/royaume');
		}).error(function(response) {
			alert(response.message);
		});
	}
})

lnm.controller('RoyCtrl', function($scope, $http, socket) {

	socket.on('test', function (data) {
		alert(data.message);
	});

	$http.get('/royaume').success(function($roy) {
		$http.get('/infos')
	});

	$scope.testtimerandserversentmessage = function() {
		$http.post('/testtimerandserversentmessage', {})
	}
});

lnm.controller('AccCtrl', function($rootScope, $http) {


});