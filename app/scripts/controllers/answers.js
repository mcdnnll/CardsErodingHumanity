'use strict';

angular.module('caHApp')

  /**
  * Manage lists of good and bad answers
  * As the round questioner decides on answers, they are
  * pushed to either the good or bad answer lists.
  */
	.controller('TVReadAnswersCtrl',
  	function ($scope, $location, GameService, $wamp, $route) {
  		$scope.goodAnswers = GameService.game.goodAnswers;
  		$scope.badAnswers = GameService.game.badAnswers;
  		$scope.question = GameService.game.currentQuestion.text;

      // Ensure that tv is still synchronised with the game state
  		GameService.checkQuit('tv');

      // View the current game's winner at the end of a round
  		if (GameService.game.winningAnswer !== null) {
  			$location.path('/tvviewwinner');
  		}
  		// Reload on Gameservice Broadcast
  		$scope.$on('GameUpdate', function(){
  			$route.reload();
  		});
  	})


	.controller('QuestionerSubmitAnswersCtrl',
		function ($scope, $location, GameService, $wamp, $route) {
      $scope.question = GameService.game.currentQuestion.text;
			GameService.checkQuit('player');

			if (GameService.game.numAnswered === (GameService.game.numPlayers - 1 + GameService.game.isSoleLoser)) {
				$location.path('/questionerreadanswers');
			}

			// Reload on Gameservice Broadcast
			$scope.$on('GameUpdate', function() {
				$route.reload();
			});
		})


	.controller('QuestionerReadAnswersCtrl',
		function ($scope, $location, $wamp, $route, GameService) {

			$scope.numRated = GameService.game.numRated;
			$scope.isSoleLoser = GameService.game.isSoleLoser;
			$scope.numPlayers = GameService.game.numPlayers;
			$scope.playerAnswerArray = GameService.game.nextAnswerForRating.playerAnswersArray;

			GameService.checkQuit('player');

			// Check if all answers have been rated
			if ($scope.numRated === ($scope.numPlayers - 1 + GameService.game.isSoleLoser)) {
				$location.path('/questionerselectwinner');
			}

			// Rate function
			$scope.rate = function (rating){
				$wamp.call('rateAnswer',[rating]);
			};

			// Reload on Gameservice Broadcast
			$scope.$on('GameUpdate', function() {
				$route.reload();

     		});
  		}
	)


	.controller('PlayerSubmitAnswersCtrl',
		function ($scope, $location, GameService, name, $wamp) {

			$scope.answerPool = GameService.getPlayer(name.name).answers;
			$scope.selectedAnswer = '';

			var answerNumber = 1;
			var answersIndexArray = [];
			var blankAnswersArray = [];
			var submittedAnswerCount = 0;

			var score = 0;

			GameService.game.players.forEach(function(player){
				if (player.name === name.name){
					score = player.score;
				}
			});

			if (name.name !== GameService.game.soleLoserName && score !== 0 && GameService.game.betting) {
				$scope.confidenceOption = true;
			}else{
				$scope.confidenceOption = false;
			}

			if (GameService.game.currentQuestion.numAnswers === 1){
				$scope.buttonName = 'Submit Answer';
				$scope.buttonStyle = 'success';
				$scope.lastAnswer = true;
			}else{
				$scope.buttonName = 'Next Answer';
				$scope.buttonStyle = 'primary';
				$scope.lastAnswer = false;
			}

			GameService.checkQuit('player');

			// Radio button select function
			$scope.selectAnswer = function(answer){
				$scope.selectedAnswer = answer;
                console.log($scope.selectedAnswer);
			};

			console.log('numAnswers is equal to:' + GameService.game.currentQuestion.numAnswers);

			// Submit answers function
			$scope.pushToAnswers = function() {

				console.log('answer number: ' , answerNumber);

                // loop through answers
                for (var i in $scope.answerPool) {
                    if ($scope.answerPool.hasOwnProperty(i)) {

                        // if answer in pool is equal to selected answer
                        if ($scope.answerPool[i] === $scope.selectedAnswer) {

	                        if ($scope.selectedAnswer.text === 'BLANK'){
		                        blankAnswersArray.push($scope.inputAnswer);
		                        $scope.inputAnswer = '';
	                        }

							console.log('inside the loop');

                            // Push index of answer to answersIndexArray
                            answersIndexArray.push(i);

                            // Check if that was the last answer to be submitted
                            if (answerNumber === GameService.game.currentQuestion.numAnswers) {
								console.log('answerNumber  and currentQ.numAnswers are equal to' , answerNumber);

								console.log(answersIndexArray);
                                if (name.name === GameService.game.soleLoserName && submittedAnswerCount === 0) {
	                                console.log('bonus wamp call');
	                                console.log('blankAnswersArray:' , blankAnswersArray);
	                                $wamp.call('submitAnswer', [name.name, answersIndexArray, true, $scope.isConfident, blankAnswersArray]);
	                                answerNumber = 0;
	                                answersIndexArray = [];
	                                submittedAnswerCount++;
	                                $scope.message = 'You aren\'t doing so good. Have a bonus attempt!';
								}
								else {
	                                console.log('else: blankAnswersArray:' , blankAnswersArray);
	                                console.log('final wamp call before moving to /playerreadanswers');
	                                $wamp.call('submitAnswer', [name.name, answersIndexArray, false, $scope.isConfident, blankAnswersArray]);
	                                $location.path('/playerreadanswers');
								}
                            }
                            // Else reset selectedAnswer variable
                            else {
	                            $scope.selectedAnswer = false;
                            }

							// Remove answer from answer pool
							$scope.answerPool.splice(i, 1);
                        }
                    }
                }

				if (answerNumber === (GameService.game.currentQuestion.numAnswers - 1 )){
					console.log('changing to submit answer');
					$scope.buttonName = 'Submit Answer';
					$scope.buttonStyle = 'success';
					$scope.lastAnswer = true;
				}else{
					console.log('changing to next answer');
					$scope.buttonName = 'Next Answer';
					$scope.buttonStyle = 'primary';
					$scope.lastAnswer = false;
				}

				answerNumber++;
			};

			// Reload on Gameservice Broadcast
			$scope.$on('GameUpdate', function() {
				GameService.checkQuit('player');
			});
		}
	)


	.controller('PlayerReadAnswersCtrl',
		function ($scope, $location, $wamp, name, $route, GameService) {

			GameService.checkQuit('player');

			if (GameService.game.winningAnswer !== null) {
				$location.path('/playerviewwinner');
			}


			// Reload on Gameservice Broadcast
			$scope.$on('GameUpdate', function() {
				$route.reload();
			});
		}
	);
