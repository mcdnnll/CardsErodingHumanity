'use strict';

angular.module('caHApp')

  .controller('TVQuestionCtrl',
    function ($scope, $location, GameService, $route) {
      $scope.questioner = GameService.game.questioner;
      $scope.revealQuestion = GameService.game.revealQuestion;
      $scope.question = GameService.game.currentQuestion;
      $scope.players = GameService.game.players;
      GameService.checkQuit('tv');

      // Set plural or singular text
      $scope.answertext = ($scope.question.numAnswers > 1) ? 'answers' : 'answer';

      // Once all questions have been answered move the tv to read answers view
      if (GameService.game.numAnswered === (GameService.game.numPlayers - 1 + GameService.game.isSoleLoser)) {
        $location.path('/tvreadanswers');
      }

      $scope.$on('GameUpdate', function() {
        $route.reload();
      });
    })

  .controller('PlayerQuestionCtrl',
    function ($scope, $location, GameService, $route) {
      $scope.questioner = GameService.game.questioner;
      GameService.checkQuit('player');

      // Once questioner has revealed the question, move them to
      // view to select an answer
      if (GameService.game.revealQuestion === true) {
        $location.path('/playersubmitanswers');
      }

      $scope.$on('GameUpdate', function() {
        $route.reload();
      });
    })

  .controller('QuestionerQuestionCtrl',
    function ($scope, $location, $wamp, GameService, $route) {
      $scope.question = GameService.game.currentQuestion.text;
      GameService.checkQuit('player');

      // Make RPC call to reveal the question and move to view
      // awaiting answers from players
      $scope.go = function(path) {
        $wamp.call('revealQuestion', []);
        console.log('Questioner: trying to go to: ' + path);
        $location.path(path);
      };

      $scope.$on('GameUpdate', function() {
        $route.reload();
      });
    });
