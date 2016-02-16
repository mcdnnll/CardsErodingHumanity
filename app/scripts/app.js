'use strict';

// Update IP for individual lAN settings
var host = '192.168.1.103';
var port = 9001;

var caHApp = angular.module('caHApp', ['ngAnimate','ngCookies', 'ngResource','ngRoute', 'ngSanitize', 'ngTouch', 'vxWamp', 'timer']);

//========================================================================
// * App routing configuration
//========================================================================

caHApp.config(
	function ($routeProvider) {

		//========================================================================
		// Player Routes
		$routeProvider
		.when('/', {
			templateUrl: 'views/Player/player.home.html'
		})

		.when('/admin', {
			templateUrl: 'views/Player/player.admin.html'
		})

		.when('/join', {
			templateUrl: 'views/Player/player.join.html'
		})
		.when('/rejoin', {
			templateUrl: 'views/Player/player.rejoin.html'
		})

		.when('/playerlobby', {
			templateUrl: 'views/Player/player.lobby.html'
		})

		.when('/playerquestion', {
			templateUrl: 'views/Player/player.question.html'
		})

		.when('/playerleaderboard', {
			templateUrl: 'views/Player/player.leaderboard.html'
		})

		.when('/playersubmitanswers', {
			templateUrl: 'views/Player/player.submitanswers.html'
		})

		.when('/playerreadanswers', {
			templateUrl: 'views/Player/player.readanswers.html'
		})

		.when('/playerviewwinner', {
            templateUrl: 'views/Player/player.viewwinner.html'
		})



		//========================================================================
		// Questioner Routes

		.when('/questionerquestion', {
			templateUrl: 'views/Player/questioner.question.html'
		})

		.when('/questionersubmitanswers', {
			templateUrl: 'views/Player/questioner.submitanswers.html'
		})

		.when('/questionerreadanswers', {
			templateUrl: 'views/Player/questioner.readanswers.html'
		})

		.when('/questionerselectwinner', {
			templateUrl: 'views/Player/questioner.selectwinner.html'
		})



		//========================================================================
		// TV Routes
		.when('/tv', {
			templateUrl: 'views/TV/tv.lobby.html'
		})

		.when('/tvrejoin', {
			templateUrl: 'views/TV/tv.rejoin.html'
		})

		.when('/tvquestion', {
			templateUrl: 'views/TV/tv.question.html'
		})


		.when('/tvleaderboard', {
			templateUrl: 'views/TV/tv.leaderboard.html'
		})

		.when('/tvreadanswers', {
			templateUrl: 'views/TV/tv.readanswers.html'
		})

		.when('/tvviewwinner', {
			templateUrl: 'views/TV/tv.viewwinner.html'
		})

		//========================================================================
		// Routes with shared controllers
		.when('/playerload', {
			templateUrl: 'views/Player/player.load.html'
		})

		.when('/tvload', {
			templateUrl: 'views/TV/tv.load.html'
		})

		.when('/gameresult', {
			templateUrl: 'views/Player/game.result.html'
		})


			//========================================================================
		.when('/testingleaderboard', {
			templateUrl: '../views/Testing/testing.leaderboard.html'
		})



		.otherwise({
			redirectTo: '/'
		});
  })


//========================================================================
// *  WS/WAMP configuration settings
//========================================================================
.config(function($wampProvider) {
	$wampProvider.init({
    url: 'ws://' + host +':' + port + '/ws',
		realm: 'realm1'
	});
})

//========================================================================
//*  Open WS connection with the server upon starting up the application
//========================================================================
.run(function($wamp) {
	$wamp.open();
})


//========================================================================
// Store Name of player to be accessible to the application globally
//========================================================================
.value('name', {
  name: ''
})

//========================================================================
// * GameService actively listens for global updates to
// * the game object being transmitted from server.
// *
// * getGame RPC call made immediately upon starting up, providing the app
// * with the most current version of the Game object, allowing routing
// * decisions to be made based on the games' state. (i.e. if no game is running
// * home.html will show a start game button, if game is running, show join button).
// *
// * onGameStateEvent updates local copy of game object and re-broadcasts
// * to all controllers that are actively listening via $on event. This allows
// * the model/view to be updated as soon as new data is received, rather than
// * needing to invoke getGame() manually.
// *
// * getGame() allows controllers to access the game object between broadcasts.
//========================================================================

.service('GameService', function($wamp, $rootScope, $q, $location, name) {

	var self = this;
	this.game = {};

  	// Listen for game update from WAMP server, broadcast to controllers.
	function onGameUpdate(args) {
		console.log('GameService: Received latest Game object:');
		self.game = args[0];
		console.log(self.game);
		$rootScope.$broadcast('GameUpdate');
	}

	$wamp.subscribe('WAMPGameUpdate', onGameUpdate);

	this.getGame = function() {
		var deferred = $q.defer();

		// RPC call to get Game object
		$wamp.call('getGame', []).then(

			function (newGame) {
				console.log(newGame);
				self.game = newGame;
				console.log('GameService: Received initial Game object');
				//$rootScope.$broadcast('GameUpdate', [self.game]);
				deferred.resolve(newGame);
			},
			function (err) {
				console.log('GameService: Error, could not game retrieve object' + err);
				deferred.reject(err);
			}
		);
		return deferred.promise;
	};

	this.getPlayer = function(name){
		console.log('inside getplayer2');
		var desiredPlayer = {};
		self.game.players.forEach(function (player){
			console.log('inside foreach2');
			if (player.name === name) {
				desiredPlayer = player;
			}
		});
		return desiredPlayer;
	};

	this.checkQuit = function(user){
		if (self.game.gameStatus === 'gameNone') {
			if (user === 'player') {
				$location.path('/join');
			}else{
				$location.path('/tv');
			}
		}
		if (self.game.gameStatus === 'gameReset') {
			if (user === 'player') {
				self.game.players.forEach(function (player){
					if (player.name === name.name) {
						if (player.rejoin === false){
							$location.path('/rejoin');
						}
					}
				});
			}else{
				$location.path('/tvrejoin');
			}
		}
	};

})

.filter('abs', function() {
	return function(input) {
		return Math.abs(input);
	};
})
;
