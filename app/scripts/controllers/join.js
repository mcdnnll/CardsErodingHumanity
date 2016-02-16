'use strict';

angular.module('caHApp')
	.controller('JoinCtrl',
		function ($scope, $location, $wamp, name, GameService, $route) {

            $scope.gameStatus = GameService.game.gameStatus;
			$scope.nameTakenAlert = false;

			// Redirect to lobby once game has started
			$scope.submit = function() {

				var sanitizedName = $scope.name.charAt(0).toUpperCase() + $scope.name.slice(1).toLowerCase();
				var uniqueNameFlag = true;
				for (var i in GameService.game.players){
							if (GameService.game.players[i].name === sanitizedName){
								$scope.nameTakenAlert = true;
								uniqueNameFlag = false;
								break;
							}
				}
				if (uniqueNameFlag){
					$wamp.call('registerPlayer', [sanitizedName]);
					name.name = sanitizedName;
					$location.path('/playerlobby');
				}
			};

			// Listen for changes to the game status
			$scope.$on('GameUpdate', function() {
				$scope.gameStatus = GameService.game.gameStatus;
			});
	})

	.controller('RejoinCtrl',
	function ($scope, $location, $wamp, name, GameService, $route) {

		$scope.gameStatus = GameService.game.gameStatus;
		$scope.players = GameService.game.players;

		// Redirect to lobby once game has started
		$scope.playerRejoin = function(playerName) {
			$wamp.call('playerRejoin', [playerName]).then(
				function(){
					console.log('Rejoin controller: player trying to move to /playerleaderboard');
					$location.path('/playerleaderboard');
				},
				function(){}
			);
		};

		// Listen for changes to the game status
		$scope.$on('GameUpdate', function() {
			$scope.gameStatus = GameService.game.gameStatus;
			$scope.players = GameService.game.players;
		});
	});

