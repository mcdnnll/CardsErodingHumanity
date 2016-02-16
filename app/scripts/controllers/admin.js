'use strict';

/**
* Controller for initial set up of game
* First user to the server is able to congfigure a new game with
* subsequent users then able to connect directly.
*
* Admin is able to manage the game by visiting '/admin' while a game is in progress
*/
angular.module('caHApp').controller('AdminCtrl',
	function ($scope, $location, $wamp, GameService, $timeout) {

		console.log('Gamestatus in admin controller: ' + GameService.game.gameStatus);

		// Use for show/hide the setUp/QuitGame buttons
		$scope.gameStatus = GameService.game.gameStatus;
		$scope.bonus = false;
		$scope.betting = false;
		$scope.blanks = false;

		// Redirect to join once game has been set up
		$scope.submit = function() {
			console.log($scope.numPlayers + $scope.bonus + $scope.betting + $scope.blanks);
			$wamp.call('setUpGame', [$scope.numPlayers, $scope.bonus, $scope.betting, $scope.blanks]);
			$location.path('/join');
		};

		// Stay on same page, to enable endgame followed be set up new game
		$scope.quitGame = function() {
			$wamp.call('quitGame', []);
		};

		// Stay on same page, to enable endgame followed be set up new game
		$scope.resetRound = function() {
			$wamp.call('resetRound', []);
			$location.path('/rejoin');
		};

		// Listen for changes to the game status
		$scope.$on('GameUpdate', function() {
			$timeout(function () {
				$scope.gameStatus = GameService.game.gameStatus;
			}, 500);
		});
	}
);
