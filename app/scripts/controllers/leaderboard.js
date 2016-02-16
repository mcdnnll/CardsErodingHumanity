'use strict';

angular.module('caHApp')

.controller('TVLeaderboardCtrl',
	function ($scope, $wamp, $location, $timeout, $filter, name, GameService) {

		var newQuestioner = GameService.game.questioner;

		var players = [];
		for (var player in GameService.game.players) {
			players.push(GameService.game.players[player].name);
		}

		$scope.lottoPlayer = players.shift();

		$timeout( function(){ callAtTimeout(players, newQuestioner, 50); }, 50);

		// Cycle through player names and end on new questioner
		function callAtTimeout(players, newQuestioner, delay) {
			players.push($scope.lottoPlayer);
			$scope.lottoPlayer = players.shift();

			if (delay < 260) {
				delay += 10;
				$timeout(function () {
					callAtTimeout(players, newQuestioner, delay);
				}, delay);
			}else{
				$scope.lottoPlayer = newQuestioner;
				$timeout(function () {
					$wamp.call('questionerChosen', []).then(
						function(){
							console.log('tv trying to move to /tvquestion');
							$location.path('/tvquestion');
						},
						function(){}
					)
				}, 5000);
				console.log('call wamp');
			}
		}

		// Leaderboard is sorted based on score
        $scope.players = GameService.game.players;
	}
)

.controller('PlayerLeaderboardCtrl',
	function ($scope, $wamp, $location, $timeout, name, GameService, $route) {

        $scope.players = GameService.game.players;
		GameService.checkQuit('player');

		if (GameService.game.isNewQuestion) {
            if (name.name === GameService.game.questioner) {
				$location.path('/questionerquestion');
			} else {
				$location.path('/playerquestion');
			}
		}

        $scope.$on('GameUpdate', function() {
            $route.reload();
		});
	}
)

	.controller('TestingLeaderboardCtrl',
	function ($scope, $wamp, $location, $timeout, name, GameService, $route) {

		$scope.players = GameService.game.players;

		GameService.checkQuit('player');

		$scope.$on('GameUpdate', function() {
			$route.reload();
		});
	}
);




