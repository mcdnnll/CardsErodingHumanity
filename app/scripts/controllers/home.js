'use strict';

angular.module('caHApp')
  .controller('HomeCtrl', function ($scope, GameService, $location, $route) {
	  GameService.getGame()
      .then(function(data) {
  			var answerPool = GameService.game.goodAnswers;
  			answerPool.push('test');

        // Update home view based on curre game state
        switch (data.gameStatus) {
          case 'gameNone':
            $scope.gameStatus = 'Not Started';
            $scope.buttonType = 'primary';
            $scope.buttonText = 'Create Game';
            $scope.page = '#/admin';
            $scope.buttonDisable = false;
            break;
          case 'gameLoading':
            $scope.gameStatus = 'Open';
            $scope.buttonType = 'success';
            $scope.buttonText = 'Join Game';
            $scope.page = '#/join';
            $scope.buttonDisable = false;
            break;
          case 'gameActive':
            $scope.gameStatus = 'In Progress...';
            $scope.buttonType = 'danger';
            $scope.buttonText = 'Please Wait';
            $scope.buttonDisable = true;
            break;
          case 'gameReset':
            $scope.gameStatus = 'Resetting Round';
            $scope.buttonType = 'primary';
            $scope.buttonText = 'Please Rejoin';
            $scope.page = '#/rejoin';
            $scope.buttonDisable = false;
            break;
            default:
        }
  		},
  		function(err) {
  			console.log(err);
  		});

  	// Listen for changes to the global game object
  	$scope.$on('GameUpdate', function() {
  		$route.reload();
  	});
});
