'use strict';

angular.module('caHApp')

	.controller('TVLobbyCtrl',
		function ($scope, GameService, $location, $route) {

      // Retrieve new game state and start round
      GameService.getGame()
        .then(function(data) {
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
		})


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

      // UI interaction when pressing the spinner
      $scope.count = 0;
      $scope.press = function() {
          $scope.count++;
          switch($scope.count) {
            case 1:
              $scope.message = "Still waiting!";
              break;
            case 2:
              $scope.message = "Hopefully not too much longer!";
              break;
            case 3:
              $scope.message = "Okay " + name.name + ", patience please.";
              break;
            case 4:
              $scope.message = "You might as well join for them";
              break;
            case 5:
              $scope.message = "Don't worry, I am as embarassed as you are.";
              break;
            default:
              break;
          }
      };

  		GameService.checkQuit('player');
  		$scope.$on('GameUpdate', function(event) {
  			$route.reload();
  		});
  	}
  );
