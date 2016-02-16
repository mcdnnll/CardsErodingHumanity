'use strict';

angular.module('caHApp')

	.controller('QuestionerSelectWinnerCtrl',
		function ($scope, $location, GameService, $wamp) {
      $scope.winningAnswer = '';
      $scope.selectAnswer = function(answer){
        $scope.winningAnswer = answer;
      };

      $scope.chooseWinner = function()){
        $wamp.call('chooseWinner',[$scope.winningAnswer])
          .then(function() {
            $location.path('/playerleaderboard');
          // TODO: Test and remove
          },function(){
          });
      };

      // Questioner selects winner from 'good' list.
			if (GameService.game.goodAnswers.length >= 1) {
				$scope.quality = 'hilarious';
        $scope.playerAnswers = GameService.game.goodAnswers;

      // Questioner who rates all answers bad must select a final winner.
      } else {
    		$scope.quality = 'terrible';
        console.log(GameService.game.badAnswers);
        $scope.playerAnswers = GameService.game.badAnswers;
      }
		})

	.controller('TVViewWinnerCtrl',
		function ($scope, $location, GameService, $wamp, $timeout) {
			$scope.question = GameService.game.currentQuestion.text;
			$scope.winningAnswer = GameService.game.winningAnswer;

			$timeout(function () {
				$location.path('/tvleaderboard');
			}, 8000);
		})

	.controller('PlayerViewWinnerCtrl',
  	function ($scope, $location, GameService, $wamp, $timeout, name) {

      // Display round outcome
  		if (GameService.game.winningAnswer.playerName === name.name) {
  			$scope.result = 'WINNER!';
        $scope.message = 'Total Badass! Congrats!';
        $scope.textColour = 'success';
  		} else {
  			$scope.result = 'LOSER!';
        $scope.message = 'Clearly you\'re not as funny as you think you are!';
        $scope.textColour = 'danger';
      };

      // Show leaderboard for 8 seconds before switching views
  		$timeout(function () {
  			$location.path('/playerleaderboard');
  		}, 8000);
  	})

	.controller('GameResultCtrl',
  	function ($scope, $location, GameService, $route) {
  		// TODO: show winner and leadboard
  		GameService.checkQuit('player');

  		$scope.$on('GameUpdate', function() {
  			$route.reload();
  		});
  	});
