'use strict';

angular.module('caHApp')

    .controller('TVQuestionCtrl',
  		function ($scope, $location, GameService, $route) {
  			$scope.questioner = GameService.game.questioner;
  			$scope.revealQuestion = GameService.game.revealQuestion;
  			$scope.question = GameService.game.currentQuestion;
  			$scope.players = GameService.game.players;

  			GameService.checkQuit('tv');

  			if ($scope.question.numAnswers > 1){
  				$scope.answertext = 'answers';
  			}else{
  				$scope.answertext = 'answer';
  			}

  			if (GameService.game.numAnswered === (GameService.game.numPlayers - 1 + GameService.game.isSoleLoser)) {
  				$location.path('/tvreadanswers');
  			}

  			$scope.$on('GameUpdate', function() {
  				$route.reload();
  			});
    	}
	)
    .controller('PlayerQuestionCtrl',
		function ($scope, $location, GameService, $route) {
			$scope.questioner = GameService.game.questioner;

			GameService.checkQuit('player');

			if (GameService.game.revealQuestion === true) {
				$location.path('/playersubmitanswers');
			}

			$scope.$on('GameUpdate', function() {
				$route.reload();
      		});
    	}
	)
    .controller('QuestionerQuestionCtrl',
		function ($scope, $location, $wamp, GameService, $route) {
            $scope.question = GameService.game.currentQuestion.text;

			GameService.checkQuit('player');

			$scope.go = function(path) {
				$wamp.call('revealQuestion', []);
				console.log('Questioner: trying to go to: ' + path);
				$location.path(path);
			};

			$scope.$on('GameUpdate', function() {
				$route.reload();
			});
	    }
	);

