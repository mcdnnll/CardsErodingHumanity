'use strict';

angular.module('caHApp')

	.controller('TVLobbyCtrl',
		function ($scope, GameService, $location, $route) {
			GameService.getGame().then(
				function(data) {
					if (data.gameStatus === 'gameActive') {
						$location.path('/tvload');
					}
					$scope.numPlayers = data.numPlayers - data.players.length;
					$scope.players = data.players;
					$scope.gameStatus = data.gameStatus;
			});

			$scope.$on('GameUpdate', function(event) {
				$route.reload();
	        });
		}
	)
	.controller('TvRejoinLobbyCtrl',
	function ($scope, $location, $wamp, name, GameService, $route) {

		$scope.players = GameService.game.players;

		// Listen for changes to the game status
		$scope.$on('GameUpdate', function() {
			$scope.players = GameService.game.players;

			if (GameService.game.gameStatus === 'gameActive'){
				$location.path('/tvleaderboard');
			}

		});
	})

.controller('PlayerLobbyCtrl',
	function ($scope, GameService, $location, $route, name) {

		if (GameService.game.gameStatus === 'gameActive') {
			$location.path('/playerload');
		}
        $scope.count = 0;
        $scope.press = function() {
            $scope.count++;
            if ($scope.count == 1) {
                $scope.message = "Still waiting!";
            } else if($scope.count == 2) {
                $scope.message = "Hopefully not too much longer!";
            } else if($scope.count == 3) {
                $scope.message = "Okay " + name.name + ", patience please.";
            } else if($scope.count == 4) {
                $scope.message = "You might as well join for them";
            } else if($scope.count == 5) {
                $scope.message = "Don't worry, I am as embarassed as you are.";
            }
        };

		GameService.checkQuit('player');

		$scope.$on('GameUpdate', function(event) {
			$route.reload();
		});
	}
);
